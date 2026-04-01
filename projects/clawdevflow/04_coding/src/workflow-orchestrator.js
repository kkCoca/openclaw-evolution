/**
 * Workflow Orchestrator (流程编排器)
 * 
 * 负责：
 * - 状态机管理
 * - 阶段调度
 * - AI 工具调用
 * - 审阅协议执行
 * - 回滚机制
 * 
 * @version 2.1.0
 * @author openclaw-ouyp
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 审阅 Agent v2.0（新增）
const ReviewDesignAgentV2 = require('./review-agents/review-design-v2');

// 阶段定义
const STAGES = [
  'designing',
  'roadmapping',
  'detailing',
  'coding',
  'reviewing'
];

// 审阅结论枚举
const ReviewDecision = {
  PASS: 'pass',
  CONDITIONAL: 'conditional',
  REJECT: 'reject',
  CLARIFY: 'clarify',
  TERMINATE: 'terminate'
};

/**
 * 流程编排器类
 */
class WorkflowOrchestrator {
  /**
   * 构造函数
   * @param {object} config - 配置文件
   * @param {StateManager} stateManager - 状态管理器
   */
  constructor(config, stateManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.currentStageIndex = 0;
  }
  
  /**
   * 执行工作流
   * @param {object} workflow - 工作流配置
   */
  async execute(workflow) {
    console.log('[Orchestrator] 开始执行工作流', { workflowId: workflow.id });
    
    // 检查是否有已保存的状态（断点续传）
    const resumed = await this.stateManager.load();
    if (resumed) {
      console.log('[Orchestrator] 从断点恢复执行');
      this.currentStageIndex = this.stateManager.getCurrentStageIndex();
    }
    
    // 执行各阶段
    while (this.currentStageIndex < STAGES.length) {
      const stageName = STAGES[this.currentStageIndex];
      console.log(`[Orchestrator] 开始执行阶段：${stageName}`);
      
      try {
        // 执行阶段
        await this.executeStage(stageName, workflow);
        
        // 等待审阅
        const decision = await this.waitForReview(stageName);
        
        // 处理审阅结论
        const shouldContinue = await this.handleReviewDecision(stageName, decision);
        
        if (!shouldContinue) {
          console.log('[Orchestrator] 流程终止');
          break;
        }
        
        // 进入下一阶段
        this.currentStageIndex++;
        
      } catch (error) {
        console.error(`[Orchestrator] 阶段 ${stageName} 执行失败:`, error.message);
        throw error;
      }
    }
    
    console.log('[Orchestrator] 工作流执行完成');
  }
  
  /**
   * 执行单个阶段
   * @param {string} stageName - 阶段名称
   * @param {object} workflow - 工作流配置
   */
  async executeStage(stageName, workflow) {
    console.log(`[Orchestrator] 执行阶段：${stageName}`);
    
    // 1. 更新状态为执行中
    this.stateManager.updateStage(stageName, 'running');
    
    // 2. 准备阶段输入
    const input = await this.prepareStageInput(stageName, workflow);
    
    // 3. 获取 AI 工具配置
    const stageConfig = this.config.stages[stageName];
    const aiTool = stageConfig.aiTool || this.config.global.defaultAITool;
    
    // 4. 调用 AI 工具
    console.log(`[Orchestrator] 调用 AI 工具：${aiTool}`);
    const result = await this.callAITool(stageName, input, aiTool);
    
    // 5. 记录输出
    this.stateManager.addOutputs(stageName, stageConfig.outputs);
    this.stateManager.setSessionId(stageName, result.sessionId);
    
    // 6. 更新状态为待审阅
    this.stateManager.updateStage(stageName, 'reviewing');
    
    // 7. 执行审阅（v2.0 新增：designing 阶段使用 ReviewDesignAgent v2.0）
    if (stageName === 'designing' && this.config.reviewAgent?.version === 'v2.0') {
      console.log('[Orchestrator] 使用 ReviewDesignAgent v2.0 执行审阅...');
      const reviewResult = await this.executeDesignReviewV2(input);
      
      // 处理 v2.0 审阅结果
      const decision = this.convertV2ReviewToDecision(reviewResult);
      await this.handleReviewDecision(stageName, decision, reviewResult);
    } else {
      // 7b. 发送审阅请求（传统方式）
      await this.sendReviewRequest(stageName, result.outputs);
    }
    
    console.log(`[Orchestrator] 阶段 ${stageName} 执行完成`);
    
    return result;
  }
  
  /**
   * 执行 Design 阶段审阅（v2.0）
   * @param {object} input - 阶段输入
   * @returns {Promise<object>} 审阅报告
   */
  async executeDesignReviewV2(input) {
    try {
      const agent = new ReviewDesignAgentV2(this.config);
      const report = await agent.executeReview(input);
      
      console.log('[Orchestrator] ReviewDesignAgent v2.0 审阅完成');
      console.log(`[Orchestrator] Freshness Gate: ${report.gates.freshness?.passed ? '✅' : '❌'}`);
      console.log(`[Orchestrator] Traceability Gate: ${report.gates.traceability?.passed ? '✅' : '❌'}`);
      console.log(`[Orchestrator] 综合评分：${report.overall.score}/100`);
      console.log(`[Orchestrator] 审阅结论：${report.overall.recommendation}`);
      
      // 保存审阅报告
      this.stateManager.setReviewReport('designing', report);
      
      return report;
      
    } catch (error) {
      console.error('[Orchestrator] ReviewDesignAgent v2.0 执行失败:', error.message);
      return {
        error: error.message,
        overall: { passed: false, score: 0, recommendation: 'error' }
      };
    }
  }
  
  /**
   * 将 v2.0 审阅报告转换为审阅结论
   * @param {object} reviewResult - v2.0 审阅报告
   * @returns {string} 审阅结论
   */
  convertV2ReviewToDecision(reviewResult) {
    if (reviewResult.error) {
      return ReviewDecision.CLARIFY; // 错误需要澄清
    }
    
    // Freshness Gate 或 Traceability Gate 失败 → 直接驳回
    if (!reviewResult.gates.freshness?.passed || !reviewResult.gates.traceability?.passed) {
      return ReviewDecision.REJECT;
    }
    
    // 根据综合评分转换
    switch (reviewResult.overall.recommendation) {
      case 'approve_excellent':
      case 'approve':
        return ReviewDecision.PASS;
      case 'conditional':
        return ReviewDecision.CONDITIONAL;
      case 'reject':
        return ReviewDecision.REJECT;
      default:
        return ReviewDecision.CLARIFY;
    }
  }
  
  /**
   * 准备阶段输入
   * @param {string} stageName - 阶段名称
   * @param {object} workflow - 工作流配置
   * @returns {object} 阶段输入
   */
  async prepareStageInput(stageName, workflow) {
    const projectPath = workflow.projectPath;
    
    switch (stageName) {
      case 'designing':
        return {
          requirementsFile: projectPath + '/REQUIREMENTS.md',
          scenario: workflow.scenario,
          outputPath: projectPath + '/01_designing'
        };
        
      case 'roadmapping':
        return {
          prdFile: projectPath + '/01_designing/PRD.md',
          trdFile: projectPath + '/01_designing/TRD.md',
          outputPath: projectPath + '/02_roadmapping'
        };
        
      case 'detailing':
        return {
          prdFile: projectPath + '/01_designing/PRD.md',
          trdFile: projectPath + '/01_designing/TRD.md',
          roadmapFile: projectPath + '/02_roadmapping/ROADMAP.md',
          outputPath: projectPath + '/03_detailing'
        };
        
      case 'coding':
        return {
          detailFile: projectPath + '/03_detailing/DETAIL.md',
          outputPath: projectPath + '/04_coding'
        };
        
      case 'reviewing':
        return {
          projectPath: projectPath,
          documents: [
            '01_designing/PRD.md',
            '01_designing/TRD.md',
            '02_roadmapping/ROADMAP.md',
            '03_detailing/DETAIL.md',
            '04_coding/src/',
            'CHANGELOG.md'
          ]
        };
        
      default:
        throw new Error(`未知阶段：${stageName}`);
    }
  }
  
  /**
   * 调用 AI 工具
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @param {string} aiTool - AI 工具名称
   * @returns {object} 执行结果
   */
  async callAITool(stageName, input, aiTool) {
    // TODO: 实现 AI 工具调用
    // 目前使用 sessions_spawn 模拟
    
    console.log(`[Orchestrator] 调用 ${aiTool} 执行 ${stageName}`);
    
    // 构建任务描述
    const task = this.buildStageTask(stageName, input);
    
    // 调用 OpenCode（通过 sessions_spawn）
    // 注意：实际使用时需要通过 OpenClaw 的 sessions_spawn API
    const sessionId = `session-${stageName}-${Date.now()}`;
    
    // 模拟执行（实际应该调用 OpenCode）
    await this.simulateAIToolExecution(stageName, input);
    
    return {
      sessionId,
      outputs: input.outputPath ? [input.outputPath] : [input.projectPath],
      success: true
    };
  }
  
  /**
   * 构建阶段任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildStageTask(stageName, input) {
    const taskTemplates = {
      designing: `请根据 REQUIREMENTS.md 生成 PRD.md 和 TRD.md`,
      roadmapping: `请根据 PRD.md 和 TRD.md 生成 ROADMAP.md`,
      detailing: `请根据 PRD.md、TRD.md 和 ROADMAP.md 生成 DETAIL.md`,
      coding: `请根据 DETAIL.md 生成源代码`,
      reviewing: `请对所有产出进行验收审查`
    };
    
    return taskTemplates[stageName] || `执行 ${stageName} 阶段`;
  }
  
  /**
   * 模拟 AI 工具执行（临时实现）
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   */
  async simulateAIToolExecution(stageName, input) {
    console.log(`[Orchestrator] 模拟执行 ${stageName}...`);
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`[Orchestrator] ${stageName} 模拟执行完成`);
  }
  
  /**
   * 等待审阅
   * @param {string} stageName - 阶段名称
   * @returns {string} 审阅结论
   */
  async waitForReview(stageName) {
    console.log(`[Orchestrator] 等待阶段 ${stageName} 的审阅...`);
    
    // TODO: 实现审阅等待逻辑
    // 实际应该等待用户通过 OpenClaw 界面提交审阅结论
    
    // 临时实现：直接返回 pass（实际应该等待用户输入）
    return ReviewDecision.PASS;
  }
  
  /**
   * 发送审阅请求
   * @param {string} stageName - 阶段名称
   * @param {array} outputs - 阶段输出
   */
  async sendReviewRequest(stageName, outputs) {
    console.log(`[Orchestrator] 发送 ${stageName} 审阅请求...`);
    
    // TODO: 实现审阅请求发送
    // 实际应该通过 OpenClaw 的消息系统发送审阅请求给用户
    
    const stageConfig = this.config.stages[stageName];
    const checkpoints = stageConfig.reviewCheckpoints || [];
    
    console.log('[Orchestrator] 审阅检查点:');
    checkpoints.forEach(cp => {
      console.log(`  - [${cp.id}] ${cp.name}`);
    });
  }
  
  /**
   * 处理审阅结论
   * @param {string} stageName - 阶段名称
   * @param {string} decision - 审阅结论
   * @param {object} reviewResult - v2.0 审阅报告（可选）
   * @returns {boolean} 是否继续
   */
  async handleReviewDecision(stageName, decision, reviewResult = null) {
    console.log(`[Orchestrator] 处理审阅结论：${decision}`);
    
    // 记录审阅决策
    this.stateManager.recordReviewDecision(stageName, decision, reviewResult);
    
    switch (decision) {
      case ReviewDecision.PASS:
        console.log(`[Orchestrator] 阶段 ${stageName} 通过`);
        this.stateManager.updateStage(stageName, 'passed');
        return true;
        
      case ReviewDecision.CONDITIONAL:
        console.log(`[Orchestrator] 阶段 ${stageName} 条件通过`);
        this.stateManager.updateStage(stageName, 'conditional_passed');
        // 记录待修复项
        if (reviewResult?.qualityChecks) {
          const issues = Object.values(reviewResult.qualityChecks)
            .flatMap(c => c.issues || []);
          this.stateManager.addFixItems(stageName, issues);
        }
        return true;
        
      case ReviewDecision.REJECT:
        console.log(`[Orchestrator] 阶段 ${stageName} 驳回，重新执行`);
        // 策略 A：重新执行当前阶段
        this.stateManager.updateStage(stageName, 'pending', {
          retryCount: (this.stateManager.getStage(stageName).retryCount || 0) + 1,
          rejectReason: reviewResult ? this.formatRejectReason(reviewResult) : '审阅未通过'
        });
        await this.executeStage(stageName, this.stateManager.state.workflow);
        return true;
        
      case ReviewDecision.CLARIFY:
        console.log(`[Orchestrator] 阶段 ${stageName} 需澄清`);
        // TODO: 等待用户澄清
        if (reviewResult) {
          console.log('[Orchestrator] 审阅报告:', JSON.stringify(reviewResult, null, 2));
        }
        return false;
        
      case ReviewDecision.TERMINATE:
        console.log(`[Orchestrator] 流程终止`);
        this.stateManager.updateStage(stageName, 'terminated');
        return false;
        
      default:
        throw new Error(`未知审阅结论：${decision}`);
    }
  }
  
  /**
   * 格式化驳回原因（v2.0）
   * @param {object} reviewResult - v2.0 审阅报告
   * @returns {string} 驳回原因
   */
  formatRejectReason(reviewResult) {
    const reasons = [];
    
    // Freshness Gate 失败
    if (!reviewResult.gates.freshness?.passed) {
      reasons.push(`Freshness Gate: ${reviewResult.gates.freshness.reason}`);
    }
    
    // Traceability Gate 失败
    if (!reviewResult.gates.traceability?.passed) {
      reasons.push(`Traceability Gate: ${reviewResult.gates.traceability.reason}`);
    }
    
    // 质量检查失败
    if (reviewResult.overall.recommendation === 'reject') {
      const failedChecks = Object.values(reviewResult.qualityChecks)
        .filter(c => !c.passed)
        .map(c => `${c.checkpoint}: ${c.score}/100`);
      
      if (failedChecks.length > 0) {
        reasons.push(`质量检查：${failedChecks.join(', ')}`);
      }
    }
    
    return reasons.join('; ');
  }
}

// 导出
module.exports = WorkflowOrchestrator;
