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

// Policy 验证器（v3.3.0 新增）
const DesigningPolicyValidator = require('./utils/designing-policy-validator');

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
    
    // v3.3.0：启动时验证 policy 配置
    if (config.stages?.designing?.policy) {
      DesigningPolicyValidator.validateOrThrow(config.stages.designing.policy);
    }
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
    
    // 执行各阶段（v3.3.0 修复：designing 使用专用流程 P0-4）
    while (this.currentStageIndex < STAGES.length) {
      const stageName = STAGES[this.currentStageIndex];
      console.log(`[Orchestrator] 开始执行阶段：${stageName}`);
      
      try {
        // designing 阶段使用专用流程（两次确认）- v3.4.0-alpha6 修复 P0-新 2
        // v3.4.0-alpha11 修复 P0-1 (新)：统一返回语义
        if (stageName === 'designing') {
          const result = await this.executeDesigning(workflow);
          
          // v3.4.0-alpha11 修复：处理 WAITING_CONFIRMATION 和 BLOCKED
          if (!result.success) {
            if (result.reason === 'RETRY_EXHAUSTED') {
              // 重试耗尽，需要用户澄清
              console.log('[Orchestrator] designing 阶段重试耗尽，等待用户澄清');
              break;
            }
            if (result.reason === 'BLOCKED') {
              // 已阻断，需要用户介入
              console.log('[Orchestrator] designing 阶段已阻断，等待用户介入');
              break;
            }
          }
          
          // v3.4.0-alpha11 修复：检查 completed 是否为 true（两次确认已完成）
          if (result.completed === true) {
            // 两次确认已完成，进入下一阶段
            console.log('[Orchestrator] designing 阶段两次确认完成，进入 roadmapping');
            this.currentStageIndex++;
          } else {
            // 两次确认未完成（WAITING_CONFIRMATION 或 stageStatus 不是 passed）
            const designingStageStatus = this.stateManager.state.stages.designing.stageStatus;
            console.log(`[Orchestrator] designing 阶段等待用户确认（当前状态：${designingStageStatus}）`);
            break;
          }
        } else {
          // v3.4.0 修复：通用阶段使用外层循环控制重试（P1-1/P1-2）
          const maxRetries = this.config.stages[stageName]?.maxRetries || 3;
          let retryCount = 0;
          let shouldContinueToNext = false;
          
          while (retryCount < maxRetries && !shouldContinueToNext) {
            // 执行阶段
            await this.executeStage(stageName, workflow);
            
            // 等待审阅
            const decision = await this.waitForReview(stageName);
            
            // 处理审阅结论
            const result = await this.handleReviewDecision(stageName, decision);
            
            if (!result.shouldContinue) {
              // 需要用户澄清或终止
              console.log(`[Orchestrator] 阶段 ${stageName} 需要${result.reason === 'CLARIFY_REQUIRED' ? '用户澄清' : '终止流程'}`);
              break;
            }
            
            if (result.shouldRetry) {
              // 需要重试
              retryCount++;
              console.log(`[Orchestrator] 阶段 ${stageName} 第 ${retryCount} 次重试（原因：${result.reason}）`);
              
              // 检查是否达到重试限制
              if (retryCount >= maxRetries) {
                console.log(`[Orchestrator] 阶段 ${stageName} 重试 ${retryCount} 次后仍然失败，升级到 blocked`);
                this.stateManager.updateStage(stageName, 'blocked', {
                  retryCount,
                  maxRetries,
                  rejectReason: result.reason
                });
                
                // 通知用户
                await this.notifyUser('阶段重试耗尽', {
                  type: 'STAGE_RETRY_EXHAUSTED',
                  stage: stageName,
                  retryCount,
                  maxRetries,
                  reason: result.reason,
                  suggestion: '建议人工审阅并手动修复'
                });
                
                break;
              }
              
              // 继续重试（循环继续）
            } else {
              // 通过，进入下一阶段
              shouldContinueToNext = true;
            }
          }
          
          // v3.4.0 修复：重试耗尽后不应进入下一阶段（P0-新）
          if (shouldContinueToNext) {
            // 成功完成，进入下一阶段
            this.currentStageIndex++;
          } else if (retryCount >= maxRetries) {
            // 重试耗尽，阻断在當前阶段（stageStatus=blocked）
            console.log(`[Orchestrator] 阶段 ${stageName} 重试耗尽，阻断在当前阶段`);
            break;
          } else {
            // 需要用户澄清或终止
            console.log(`[Orchestrator] 阶段 ${stageName} 需要用户澄清或终止`);
            break;
          }
        }
        
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
    // v3.4.0-alpha13 修复 P1-1：禁止 executeStage 处理 designing
    if (stageName === 'designing') {
      throw new Error('designing 阶段必须使用 executeDesigning()，禁止使用 executeStage()');
    }
    
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
   * 将 v2.0 审阅报告转换为审阅结论（v3.3.0 修复：返回 ReviewDecision 枚举）
   * @param {object} reviewResult - v2.0 审阅报告
   * @returns {string} ReviewDecision 枚举值（pass/conditional/reject/clarify）
   */
  convertV2ReviewToDecision(reviewResult) {
    if (reviewResult.error) {
      return ReviewDecision.CLARIFY;
    }
    
    // 使用新的决策逻辑（v3.2.0）
    const policy = this.config.stages.designing.policy;
    const agent = new ReviewDesignAgentV2(this.config);
    const decisionResult = agent.makeDecision(reviewResult, policy);
    
    // 转换为 ReviewDecision 枚举（兼容 handleReviewDecision）
    if (decisionResult.decision === 'PASS') {
      return ReviewDecision.PASS;
    } else if (decisionResult.decision === 'BLOCK') {
      // BLOCK 可能来自 conditional 或 blockingIssues
      return ReviewDecision.REJECT;
    } else {
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
   * 处理审阅结论（v3.4.0 修复：P1-1 去递归，P1-2 引入重试限制）
   * @param {string} stageName - 阶段名称
   * @param {string} decision - 审阅结论
   * @param {object} reviewResult - v2.0 审阅报告（可选）
   * @returns {{shouldContinue: boolean, shouldRetry: boolean, reason?: string}} 决策结果
   */
  async handleReviewDecision(stageName, decision, reviewResult = null) {
    console.log(`[Orchestrator] 处理审阅结论：${decision}`);
    
    // 记录审阅决策
    this.stateManager.recordReviewDecision(stageName, decision, reviewResult);
    
    switch (decision) {
      case ReviewDecision.PASS:
        console.log(`[Orchestrator] 阶段 ${stageName} 通过`);
        this.stateManager.updateStage(stageName, 'passed');
        return { shouldContinue: true, shouldRetry: false };
        
      case ReviewDecision.CONDITIONAL:
        console.log(`[Orchestrator] 阶段 ${stageName} 条件通过`);
        // v3.4.0 修复：conditional 一律阻断，返回重试信号（P1-1）
        console.log('[Orchestrator] conditional 视同 reject，返回重试信号');
        this.stateManager.updateStage(stageName, 'rejected');
        return { shouldContinue: true, shouldRetry: true, reason: 'CONDITIONAL_BLOCKED' };
        
      case ReviewDecision.REJECT:
        console.log(`[Orchestrator] 阶段 ${stageName} 驳回，返回重试信号`);
        // v3.4.0 修复：返回重试信号，由 execute() 控制重试（P1-1）
        this.stateManager.updateStage(stageName, 'rejected');
        return { shouldContinue: true, shouldRetry: true, reason: reviewResult ? this.formatRejectReason(reviewResult) : '审阅未通过' };
        
      case ReviewDecision.CLARIFY:
        console.log(`[Orchestrator] 阶段 ${stageName} 需澄清`);
        if (reviewResult) {
          console.log('[Orchestrator] 审阅报告:', JSON.stringify(reviewResult, null, 2));
        }
        // 需要用户澄清，阻断流程
        return { shouldContinue: false, shouldRetry: false, reason: 'CLARIFY_REQUIRED' };
        
      case ReviewDecision.TERMINATE:
        console.log(`[Orchestrator] 流程终止`);
        this.stateManager.updateStage(stageName, 'terminated');
        return { shouldContinue: false, shouldRetry: false, reason: 'USER_TERMINATED' };
        
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

  // =========================================================================
  // v3.3.0 新增：小需求检测（智能确认模式）
  // =========================================================================

  /**
   * 检测是否为小需求（v3.3.0 新增，P0-5 修复：使用内容而非路径）
   * @param {object} input - 阶段输入（包含 requirementsContent/prdContent/trdContent）
   * @returns {Promise<boolean>} 是否为小需求
   */
  async isSmallScope(input) {
    const policy = this.config.stages.designing.policy.approvals;
    const smallScopeConfig = policy.small_scope || {};
    
    // 1. 检查需求数量
    const requirementsContent = input.requirementsContent || '';
    const reqCount = (requirementsContent.match(/### REQ-/g) || []).length;
    
    if (reqCount <= (smallScopeConfig.max_requirements || 2)) {
      console.log(`[Orchestrator] 小需求检测：需求数量 ${reqCount} <= ${smallScopeConfig.max_requirements || 2} ✅`);
      return true;
    }
    
    // 2. 检查 PRD 行数（如果已生成）
    if (input.prdContent) {
      const prdLines = input.prdContent.split('\n').length;
      
      if (prdLines <= (smallScopeConfig.max_prd_lines || 200)) {
        console.log(`[Orchestrator] 小需求检测：PRD 行数 ${prdLines} <= ${smallScopeConfig.max_prd_lines || 200} ✅`);
        return true;
      }
    }
    
    // 3. 检查 TRD 行数（如果已生成）
    if (input.trdContent) {
      const trdLines = input.trdContent.split('\n').length;
      
      if (trdLines <= (smallScopeConfig.max_trd_lines || 300)) {
        console.log(`[Orchestrator] 小需求检测：TRD 行数 ${trdLines} <= ${smallScopeConfig.max_trd_lines || 300} ✅`);
        return true;
      }
    }
    
    // 4. 检查是否涉及复杂技术选型
    if (smallScopeConfig.no_complex_tech !== false) {
      const complexTechKeywords = ['微服务', '分布式', '集群', '高并发', '负载均衡', '消息队列'];
      const hasComplexTech = complexTechKeywords.some(keyword => 
        requirementsContent.includes(keyword)
      );
      
      if (!hasComplexTech) {
        console.log(`[Orchestrator] 小需求检测：不涉及复杂技术选型 ✅`);
        return true;
      }
    }
    
    console.log(`[Orchestrator] 小需求检测：不满足小需求标准，使用 two_step 模式`);
    return false;
  }

  // =========================================================================
  // v3.2.0 新增：两次确认入口
  // =========================================================================

  /**
   * 确认 PRD（v3.2.0 新增，v3.3.0 更新：支持小需求合并确认）
   * @param {object} payload - 确认载荷
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async approvePRD(payload) {
    const state = this.stateManager.state;
    const policy = this.config.stages.designing.policy.approvals;
    
    // 1. 验证状态
    if (state.stages.designing.stageStatus !== 'prd_confirm_pending' && 
        state.stages.designing.stageStatus !== 'auto_reviewing') {
      return {
        success: false,
        message: `当前状态为 ${state.stages.designing.stageStatus}，无法确认 PRD`
      };
    }
    
    // 2. 验证哈希绑定
    const currentReqHash = this.stateManager.calculateHash(state.requirementsContent);
    if (payload.requirementsHash !== currentReqHash) {
      return {
        success: false,
        message: `REQUIREMENTS 已变更，请重新审阅（期望：${currentReqHash}, 实际：${payload.requirementsHash}）`
      };
    }
    
    const currentPrdHash = this.stateManager.calculateHash(state.stages.designing.lastPrdContent);
    if (payload.prdHash !== currentPrdHash) {
      return {
        success: false,
        message: `PRD 已变更，请重新确认（期望：${currentPrdHash}, 实际：${payload.prdHash}）`
      };
    }
    
    // 3. 检查是否为小需求（v3.3.0）
    const isSmall = await this.isSmallScope({
      requirementsContent: state.requirementsContent,
      prdContent: state.stages.designing.lastPrdContent,
      trdContent: state.stages.designing.lastTrdContent
    });
    
    // 4. v3.3.0 Phase 1：暂时关闭小需求合并确认（P1-1 建议）
    // if (isSmall && policy.mode === 'auto') { ... }
    // 当前策略：所有需求都使用两次确认流程
    if (false && isSmall) {  // 暂时禁用
      // 空分支，禁用小需求合并确认
    }
    
    // 5. 正常流程：只确认 PRD，等待 TRD 确认
    this.stateManager.approvePRD(
      payload.userId,
      payload.requirementsHash,
      payload.prdHash,
      payload.notes
    );
    
    // v3.3.0 修复：approvePRD 后显式推进状态（P0-1）
    // 不依赖 stateManager 内部实现，这里显式设置 stageStatus
    this.stateManager.state.stages.designing.stageStatus = 'trd_confirm_pending';
    this.stateManager.logTransition(
      'prd_confirm_pending',
      'trd_confirm_pending',
      'PRD_APPROVED',
      {
        userId: payload.userId,
        prdHash: payload.prdHash,
        requirementsHash: payload.requirementsHash
      }
    );
    this.stateManager.save();
    
    // 6. 通知用户确认 TRD
    await this.notifyUser('TRD 确认', {
      type: 'TRD_CONFIRMATION_REQUEST',
      message: 'PRD 已确认，请确认 TRD.md 技术方案',
      trdFile: '01_designing/TRD.md'
    });
    
    return {
      success: true,
      message: 'PRD 确认成功，等待 TRD 确认'
    };
  }

  /**
   * 确认 TRD（v3.2.0 新增）
   * @param {object} payload - 确认载荷
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async approveTRD(payload) {
    const state = this.stateManager.state;
    
    // 1. 验证状态
    if (state.stages.designing.stageStatus !== 'trd_confirm_pending') {
      return {
        success: false,
        message: `当前状态为 ${state.stages.designing.stageStatus}，无法确认 TRD`
      };
    }
    
    // 2. 验证哈希绑定
    const currentReqHash = this.stateManager.calculateHash(state.requirementsContent);
    if (payload.requirementsHash !== currentReqHash) {
      return {
        success: false,
        message: `REQUIREMENTS 已变更，请重新审阅（期望：${currentReqHash}, 实际：${payload.requirementsHash}）`
      };
    }
    
    const currentTrdHash = this.stateManager.calculateHash(state.stages.designing.lastTrdContent);
    if (payload.trdHash !== currentTrdHash) {
      return {
        success: false,
        message: `TRD 已变更，请重新确认（期望：${currentTrdHash}, 实际：${payload.trdHash}）`
      };
    }
    
    // 3. 记录确认
    this.stateManager.approveTRD(
      payload.userId,
      payload.requirementsHash,
      payload.trdHash,
      payload.notes
    );
    
    // v3.4.0-alpha8 修复 P0-新 3：显式设置 stageStatus='passed'
    this.stateManager.state.stages.designing.stageStatus = 'passed';
    
    // v3.5.0 整改 P0-2：写入 designing.approved 快照（roadmapping 的唯一可信输入）
    this.stateManager.state.stages.designing.approved = {
      requirementsHash: payload.requirementsHash,
      prdHash: payload.prdHash,
      trdHash: payload.trdHash,
      requirementsContent: state.requirementsContent,
      prdContent: state.stages.designing.lastPrdContent,
      trdContent: state.stages.designing.lastTrdContent,
      approvedBy: payload.userId,
      approvedAt: new Date().toISOString(),
      transitionId: `TRD_APPROVED_${Date.now()}`
    };
    
    this.stateManager.logTransition(
      'trd_confirm_pending',
      'passed',
      'TRD_APPROVED',
      {
        userId: payload.userId,
        trdHash: payload.trdHash,
        requirementsHash: payload.requirementsHash,
        transitionId: this.stateManager.state.stages.designing.approved.transitionId
      }
    );
    // v3.4.0-alpha13 修复 P1-2：同步通用 stage state（防止状态漂移）
    this.stateManager.updateStage('designing', 'passed');
    this.stateManager.save();
    
    // 4. 进入下一阶段
    console.log('[Orchestrator] Designing 阶段完成，进入 Roadmapping 阶段...');
    
    return {
      success: true,
      message: 'TRD 确认成功，Designing 阶段完成'
    };
  }

  /**
   * 执行 Designing 阶段（v3.3.0 修复：消除递归 P0-3，从文件系统读取真实内容 P0-6）
   * @param {object} workflow - 工作流配置
   * @returns {Promise<{success: boolean, report?: object, reason?: string}>}
   */
  async executeDesigning(workflow) {
    const policy = this.config.stages.designing.policy;
    const state = this.stateManager.state;
    // v3.3.0 修复：统一使用 workflow.projectPath（P0-2）
    const projectPath = workflow.projectPath || state.projectPath;
    const fs = require('fs');
    const path = require('path');
    
    // v3.4.0-alpha9 修复 P0-2：断点恢复时不得重复生成覆盖
    // v3.4.0-alpha11 修复 P0-1 (新)：统一返回语义
    const stageStatus = state.stages.designing.stageStatus;
    
    if (stageStatus === 'prd_confirm_pending' || stageStatus === 'trd_confirm_pending') {
      // 等待用户确认中，不得重复生成
      // v3.4.0-alpha11 修复：返回 success=true（等待确认是正常状态，不是失败）
      console.log(`[Orchestrator] designing 阶段等待用户确认（当前状态：${stageStatus}），跳过生成`);
      return {
        success: true,  // ✅ 等待确认是正常状态
        completed: false,  // ✅ 未完成
        reason: 'WAITING_CONFIRMATION',
        stageStatus
      };
    }
    
    if (stageStatus === 'passed') {
      // 已完成，直接返回
      console.log('[Orchestrator] designing 阶段已完成，跳过生成');
      return {
        success: true,
        completed: true,  // ✅ 已完成
        stageStatus: 'passed'
      };
    }
    
    if (stageStatus === 'blocked') {
      // 已阻断，直接返回
      console.log('[Orchestrator] designing 阶段已阻断，跳过生成');
      return {
        success: false,
        reason: 'BLOCKED',
        stageStatus: 'blocked'
      };
    }
    
    // v3.3.0 修复：显式循环控制重试（P0-3）
    let retryCount = 0;
    let lastIssueId = null;
    let sameIssueStreak = 0;
    
    while (retryCount < policy.retry.max_total_retries) {
      // 更新尝试次数
      state.stages.designing.attempt = retryCount + 1;
      this.stateManager.save();
      
      // 1. 执行单次生成
      console.log(`[Orchestrator] Designing 阶段 - 第 ${state.stages.designing.attempt} 次尝试`);
      const input = await this.prepareStageInput('designing', workflow);
      const result = await this.callAITool('designing', input, 'opencode');
      
      // v3.3.0 修复：从文件系统读取真实 PRD/TRD 内容（P0-6）
      try {
        const prdPath = path.join(projectPath, '01_designing/PRD.md');
        const trdPath = path.join(projectPath, '01_designing/TRD.md');
        const reqPath = path.join(projectPath, 'REQUIREMENTS.md');
        
        state.stages.designing.lastPrdContent = fs.readFileSync(prdPath, 'utf8');
        state.stages.designing.lastTrdContent = fs.readFileSync(trdPath, 'utf8');
        state.requirementsContent = fs.readFileSync(reqPath, 'utf8');
        
        state.stages.designing.prdGeneratedAt = Date.now();
        state.stages.designing.trdGeneratedAt = Date.now();
        this.stateManager.save();
        
        console.log('[Orchestrator] 已读取 PRD.md/TRD.md/REQUIREMENTS.md 真实内容');
      } catch (error) {
        console.error('[Orchestrator] 读取文件失败:', error.message);
        state.stages.designing.lastPrdContent = '';
        state.stages.designing.lastTrdContent = '';
        state.requirementsContent = '';
        this.stateManager.save();
      }
      
      // 2. 执行自动审阅
      console.log('[Orchestrator] 执行自动审阅...');
      const reviewResult = await this.executeDesignReviewV2(input);
      
      // v3.3.0 修复：使用结构化 decisionResult（P0-1）
      const agent = new ReviewDesignAgentV2(this.config);
      const decisionResult = agent.makeDecision(reviewResult, policy);
      
      // 3. 保存审阅报告
      state.stages.designing.lastAutoReviewReport = reviewResult;
      state.stages.designing.lastBlockingIssues = decisionResult.blockingIssues || [];
      this.stateManager.save();
      
      // 4. 判断是否通过
      if (decisionResult.decision === 'PASS') {
        // 通过，进入 PRD 确认
        state.stages.designing.stageStatus = 'prd_confirm_pending';
        this.stateManager.logTransition('auto_reviewing', 'prd_confirm_pending', 'AUTO_REVIEW_PASS', {
          attempt: state.stages.designing.attempt
        });
        
        // 发送 PRD 确认请求
        await this.notifyUser('PRD 确认', {
          type: 'PRD_CONFIRMATION_REQUEST',
          message: 'PRD.md 已生成并通过自动审阅，请确认需求范围',
          prdFile: '01_designing/PRD.md'
        });
        
        return { success: true, report: reviewResult };
      }
      
      // 5. 失败处理（BLOCK 或 CLARIFY）
      retryCount++;
      state.stages.designing.retryCountTotal = retryCount;
      
      // v3.3.0 修复：CLARIFY 处理逻辑（P0-2）
      // 如果 blockingIssues 为空，补充默认 blocker issue
      let blockingIssues = decisionResult.blockingIssues || [];
      if (blockingIssues.length === 0) {
        blockingIssues = [{
          id: 'REVIEW_CLARIFY_REQUIRED',
          severity: 'blocker',
          message: '审阅需要澄清',
          regenerateHint: '请根据审阅报告澄清需求或修复文档'
        }];
      }
      
      // 计算同问题连续次数
      const firstIssueId = blockingIssues[0].id;
      if (firstIssueId === lastIssueId) {
        sameIssueStreak++;
      } else {
        sameIssueStreak = 1;
        lastIssueId = firstIssueId;
      }
      state.stages.designing.sameIssueStreak = { issueId: firstIssueId, count: sameIssueStreak };
      this.stateManager.save();
      
      // 检查是否达到阈值
      const maxRetriesPerIssue = policy.retry.max_retries_per_issue[firstIssueId] || policy.retry.max_retries_per_issue.DEFAULT;
      
      if (
        retryCount >= policy.retry.max_total_retries ||
        sameIssueStreak >= policy.retry.same_issue_streak_limit ||
        retryCount >= maxRetriesPerIssue
      ) {
        // 超过重试次数，升级处理
        state.stages.designing.stageStatus = 'blocked';
        this.stateManager.logTransition('auto_reviewing', 'blocked', 'RETRY_EXHAUSTED', {
          retryCountTotal: retryCount,
          issueId: firstIssueId
        });
        // v3.4.0-alpha13 修复 P1-2：同步通用 stage state（防止状态漂移）
        this.stateManager.updateStage('designing', 'blocked');
        this.stateManager.save();
        
        await this.notifyUser('重试耗尽', {
          type: 'RETRY_EXHAUSTED',
          message: `Designing 阶段重试 ${retryCount} 次后仍然失败，需要人工介入`,
          issue: blockingIssues[0],
          suggestion: '建议人工审阅并手动修复 PRD.md/TRD.md'
        });
        
        return {
          success: false,
          reason: 'RETRY_EXHAUSTED',
          issue: blockingIssues[0]
        };
      }
      
      // 6. 自动返工（注入 regenerateHint）
      state.stages.designing.stageStatus = 'generating';
      this.stateManager.logTransition('auto_reviewing', 'generating', 'REWORK_REQUESTED', {
        attempt: state.stages.designing.attempt,
        issueId: firstIssueId
      });
      
      // 生成 regenerateHint
      const regenerateHint = blockingIssues.map(issue => {
        return `【强制修复】${issue.id}: ${issue.message || '修复失败项'}\n${issue.regenerateHint || ''}`;
      }).join('\n\n');
      
      // 循环继续（而非递归）
      workflow.regenerateHint = regenerateHint;
      console.log(`[Orchestrator] 第 ${retryCount} 次失败，准备第 ${retryCount + 1} 次尝试`);
    }
    
    // 不应到达这里（已被上面的检查拦截）
    return {
      success: false,
      reason: 'UNEXPECTED_ERROR',
      issue: '循环结束但未触发重试耗尽'
    };
  }

  /**
   * 通知用户（v3.4.0 新增）
   * @param {string} title - 通知标题
   * @param {object} payload - 通知载荷
   */
  async notifyUser(title, payload) {
    console.log(`[Orchestrator] 通知用户：${title}`, payload);
    // TODO: 实现实际的通知机制（邮件/消息/界面提示等）
    // 当前仅记录日志
  }
}

// 导出
module.exports = WorkflowOrchestrator;
