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
 * @version 2.0.1
 * @author openclaw-ouyp
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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
    
    // 7. 生成审阅请求
    await this.sendReviewRequest(stageName, result.outputs);
    
    console.log(`[Orchestrator] 阶段 ${stageName} 执行完成`);
    
    return result;
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
   * @returns {boolean} 是否继续
   */
  async handleReviewDecision(stageName, decision) {
    console.log(`[Orchestrator] 处理审阅结论：${decision}`);
    
    // 记录审阅决策
    this.stateManager.recordReviewDecision(stageName, decision);
    
    switch (decision) {
      case ReviewDecision.PASS:
        console.log(`[Orchestrator] 阶段 ${stageName} 通过`);
        this.stateManager.updateStage(stageName, 'passed');
        return true;
        
      case ReviewDecision.CONDITIONAL:
        console.log(`[Orchestrator] 阶段 ${stageName} 条件通过`);
        this.stateManager.updateStage(stageName, 'conditional_passed');
        return true;
        
      case ReviewDecision.REJECT:
        console.log(`[Orchestrator] 阶段 ${stageName} 驳回，重新执行`);
        // 策略 A：重新执行当前阶段
        this.stateManager.updateStage(stageName, 'pending', {
          retryCount: (this.stateManager.getStage(stageName).retryCount || 0) + 1
        });
        await this.executeStage(stageName, this.stateManager.state.workflow);
        return true;
        
      case ReviewDecision.CLARIFY:
        console.log(`[Orchestrator] 阶段 ${stageName} 需澄清`);
        // TODO: 等待用户澄清
        return false;
        
      case ReviewDecision.TERMINATE:
        console.log(`[Orchestrator] 流程终止`);
        this.stateManager.updateStage(stageName, 'terminated');
        return false;
        
      default:
        throw new Error(`未知审阅结论：${decision}`);
    }
  }
}

// 导出
module.exports = WorkflowOrchestrator;
