/**
 * Workflow Orchestrator (流程编排器)
 * 
 * ClawDevFlow (CDF) 核心编排器
 * 负责整个研发流程的调度、状态管理和审阅协调
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const StageExecutor = require('./stage-executor');
const StateManager = require('./state-manager');
const ReviewOrchestrator = require('../review-orchestrator/review-orchestrator');
const StageModule = require('./stage-executor');
const Stage = StageModule.Stage;
const StageStatus = require('./state-manager').StageStatus;
const { STAGE_SEQUENCE } = require('./constants');
const { validateRoadmappingEntry } = require('../utils/validate-roadmapping-entry');

/**
 * 流程编排器
 */
class WorkflowOrchestrator {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config || {};
    this.stageExecutor = null;  // 延迟初始化（需要 stateManager）
    this.stateManager = null;
    this.reviewOrchestrator = new ReviewOrchestrator(config);
    
    console.log('[Workflow-Orchestrator] 流程编排器初始化完成');
    console.log('[Workflow-Orchestrator] 阶段序列:', STAGE_SEQUENCE.join(' → '));
  }

  /**
   * 执行工作流
   * 
   * @param {object} workflowConfig - 工作流配置
   * @param {string} workflowConfig.projectPath - 项目路径
   * @param {string} workflowConfig.scenario - 场景类型（全新功能/增量需求/问题修复）
   * @param {string} workflowConfig.requirementsFile - 需求说明文件路径
   * @returns {Promise<{success: boolean, workflowId: string}>}
   * 
   * @example
   * ```javascript
   * const orchestrator = new WorkflowOrchestrator(config);
   * const result = await orchestrator.execute({
   *   projectPath: '/path/to/project',
   *   scenario: '全新功能',
   *   requirementsFile: 'REQUIREMENTS.md'
   * });
   * ```
   */
  async execute(workflowConfig) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ClawDevFlow (CDF) 流程执行开始                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    const { projectPath, scenario, requirementsFile } = workflowConfig;

    try {
      // 1. 初始化状态管理器
      console.log('[Workflow-Orchestrator] 步骤 1/7: 初始化状态管理器...');
      this.stateManager = new StateManager(this.config, projectPath);
      this.stateManager.setMetadata({ scenario, requirementsFile, startTime: new Date().toISOString() });
      console.log(`[Workflow-Orchestrator] ✅ 工作流 ID: ${this.stateManager.state.workflowId}`);
      console.log('');
      
      // P0#2 修复：初始化 StageExecutor（传入 stateManager 用于 Gate#2）
      this.stageExecutor = new StageExecutor(this.config, this.stateManager);

      // 2. 执行阶段循环
      console.log('[Workflow-Orchestrator] 步骤 2/7: 开始执行阶段循环...');
      console.log('');

      for (let i = 0; i < STAGE_SEQUENCE.length; i++) {
        const stageName = STAGE_SEQUENCE[i];
        const stageResult = await this.executeStage(stageName, workflowConfig);
        
        if (!stageResult.success) {
          // P1-1 修复：blocked 状态不调用 terminate，返回 blocked 状态便于恢复
          if (stageResult.blocked) {
            console.log(`[Workflow-Orchestrator] 🛑 阶段 ${stageName} 被 BLOCKED`);
            return {
              success: false,
              status: 'blocked',
              workflowId: this.stateManager.state.workflowId,
              blockedStage: stageName,
              reason: stageResult.error
            };
          }
          
          console.log(`[Workflow-Orchestrator] ❌ 阶段 ${stageName} 执行失败`);
          this.stateManager.terminate(`阶段 ${stageName} 执行失败：${stageResult.error}`);
          return {
            success: false,
            workflowId: this.stateManager.state.workflowId,
            failedStage: stageName,
            error: stageResult.error
          };
        }

        // 如果不是最后一个阶段，继续下一个
        if (i < STAGE_SEQUENCE.length - 1) {
          console.log('');
          console.log(`[Workflow-Orchestrator] ─────────────────────────────────────────────`);
          console.log('');
        }
      }

      console.log('');
      console.log('[Workflow-Orchestrator] 步骤 3/7: 所有阶段执行完成...');
      console.log('');

      // 3. 完成工作流
      this.stateManager.complete();

      // 4. 生成报告
      console.log('[Workflow-Orchestrator] 步骤 4/7: 生成工作流报告...');
      const report = this.stateManager.getReport();
      console.log('[Workflow-Orchestrator] ✅ 工作流报告已生成');
      console.log('');

      // 5. 输出总结
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║   ClawDevFlow (CDF) 流程执行完成                           ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`工作流 ID: ${report.workflowId}`);
      console.log(`项目路径：${report.projectPath}`);
      console.log(`进度：${report.progress.passed}/${report.progress.total} (${report.progress.percentage}%)`);
      console.log(`待修复项：${report.totalFixItems} 项`);
      console.log(`创建时间：${new Date(report.createdAt).toLocaleString()}`);
      console.log(`更新时间：${new Date(report.updatedAt).toLocaleString()}`);
      console.log('');

      return {
        success: true,
        workflowId: report.workflowId,
        report
      };

    } catch (error) {
      console.error('[Workflow-Orchestrator] ❌ 工作流执行失败:', error.message);
      
      if (this.stateManager) {
        this.stateManager.terminate(error.message);
      }
      
      return {
        success: false,
        workflowId: this.stateManager?.state.workflowId || 'unknown',
        error: error.message
      };
    }
  }

  /**
   * 执行单个阶段
   * @param {string} stageName - 阶段名称
   * @param {object} workflowConfig - 工作流配置
   * @returns {Promise<{success: boolean, error?: string}>}
   * @private
   */
  async executeStage(stageName, workflowConfig) {
    console.log('');
    console.log('[Workflow-Orchestrator] ════════════════════════════════════════');
    console.log(`[Workflow-Orchestrator] 阶段：${stageName.toUpperCase()}`);
    console.log('[Workflow-Orchestrator] ════════════════════════════════════════');
    console.log('');

    try {
      // Roadmapping 入口门禁（第一处：执行阶段前）
      if (stageName === 'roadmapping') {
        const validation = validateRoadmappingEntry(this.stateManager, this.stateManager.state);
        if (!validation.ok) {
          console.error(`[Workflow-Orchestrator] ❌ roadmapping 入口门禁校验失败：${validation.reason}`);
          // P1-1 修复：Gate 失败改用 BLOCKED（可恢复暂停），添加 blocked 字段
          this.stateManager.updateStage('roadmapping', StageStatus.BLOCKED, { blockReason: validation.reason });
          return {
            success: false,
            blocked: true,
            error: `roadmapping 入口门禁失败：${validation.reason}`
          };
        }
        console.log('[Workflow-Orchestrator] ✅ roadmapping 入口门禁校验通过');
      }

      // 自动返工循环（除 designing 外所有阶段）
      const autoRetryStages = ['roadmapping', 'detailing', 'coding', 'testing', 'reviewing', 'precommit', 'releasing'];
      const maxRetries = this.config.stages?.[stageName]?.maxRetries || 3;
      
      if (autoRetryStages.includes(stageName)) {
        // 自动返工模式：while 循环控制重试
        let retryCount = this.stateManager.getStage(stageName).retryCount || 0;
        
        while (retryCount < maxRetries) {
          console.log(`[Workflow-Orchestrator] 自动返工循环：第 ${retryCount + 1} 次尝试`);
          
          // 1. 更新状态为执行中
          this.stateManager.updateStage(stageName, StageStatus.RUNNING);

          // 2. 准备阶段输入（注入 attempt + regenerateHint）
          const input = await this.prepareStageInput(stageName, workflowConfig);

          // 3. 执行阶段
          const stageResult = await this.stageExecutor.execute(
            stageName,
            input,
            workflowConfig.projectPath
          );

          if (!stageResult.success) {
            return { success: false, error: stageResult.error };
          }

          // 4. 记录阶段输出
          this.stateManager.setStageOutputs(stageName, stageResult.outputs);

          // 5. 更新状态为待审阅
          this.stateManager.updateStage(stageName, StageStatus.REVIEWING);

          // 6. 执行审阅
          console.log('[Workflow-Orchestrator] 执行审阅...');
          const reviewDecision = await this.reviewOrchestrator.review(
            stageName,
            input,
            stageResult.outputs,
            workflowConfig.projectPath
          );

          // 7. 记录审阅决策
          this.stateManager.recordReviewDecision(
            stageName,
            reviewDecision.decision,
            reviewDecision.notes,
            reviewDecision.fixItems
          );

          // 8. 处理审阅决策
          if (reviewDecision.decision === 'pass') {
            // 通过：清理重试痕迹
            this.stateManager.state.stages[stageName].retryCount = 0;
            this.stateManager.state.stages[stageName].lastRegenerateHint = '';
            this.stateManager.save();
            console.log('[Workflow-Orchestrator] ✅ 审阅通过，清理重试痕迹');
            return { success: true };
          } else if (reviewDecision.decision === 'reject') {
            // 驳回：写回 regenerateHint + retryCount++
            retryCount++;
            this.stateManager.state.stages[stageName].retryCount = retryCount;
            
            // TODO-4 修复：写回 lastBlockingIssues 便于排查
            this.stateManager.state.stages[stageName].lastBlockingIssues = reviewDecision.fixItems || [];
            
            if (reviewDecision.fixItems && reviewDecision.fixItems.length > 0) {
              const hint = reviewDecision.fixItems.map(item => 
                `【${item.id}】${item.suggestion || item.description}`
              ).join('\n');
              this.stateManager.state.stages[stageName].lastRegenerateHint = hint;
            }
            
            this.stateManager.save();
            console.log(`[Workflow-Orchestrator] ❌ 审阅驳回，retryCount=${retryCount}`);
            
            if (retryCount >= maxRetries) {
              console.log('[Workflow-Orchestrator] ❌ 超过最大重试次数，终止流程');
              this.stateManager.updateStage(stageName, StageStatus.TERMINATED);
              return { success: false, error: '超过最大重试次数' };
            }
            
            // 继续循环重试
            console.log('[Workflow-Orchestrator] 🔄 开始下一次重试...');
          } else if (reviewDecision.decision === 'conditional') {
            // P0#3 修复：conditional 当作 reject 处理（触发返工）
            console.log('[Workflow-Orchestrator] ⚠️ 条件通过，当作 reject 触发返工');
            retryCount++;
            this.stateManager.state.stages[stageName].retryCount = retryCount;
            
            // TODO-4 修复：写回 lastBlockingIssues 便于排查
            this.stateManager.state.stages[stageName].lastBlockingIssues = reviewDecision.fixItems || [];
            
            if (reviewDecision.fixItems && reviewDecision.fixItems.length > 0) {
              const hint = reviewDecision.fixItems.map(item => 
                `【${item.id}】${item.suggestion || item.description}`
              ).join('\n');
              this.stateManager.state.stages[stageName].lastRegenerateHint = hint;
            }
            
            this.stateManager.save();
            
            if (retryCount >= maxRetries) {
              console.log('[Workflow-Orchestrator] ❌ 超过最大重试次数，终止流程');
              this.stateManager.updateStage(stageName, StageStatus.TERMINATED);
              return { success: false, error: '超过最大重试次数' };
            }
            
            console.log('[Workflow-Orchestrator] 🔄 开始下一次重试...');
          } else if (reviewDecision.decision === 'clarify') {
            // P0#3 修复：clarify 不得直接放行，暂停流程
            console.log('[Workflow-Orchestrator] ❓ 需澄清，暂停流程（需要人工介入）');
            // P1-1 修复：clarify 改用 BLOCKED（可恢复暂停），添加 blocked 字段
            this.stateManager.updateStage(stageName, StageStatus.BLOCKED, { blockReason: '需要澄清' });
            return { success: false, blocked: true, error: '需要澄清' };
          }
        }
        
        // TODO-1 修复：禁止 while-loop 结束后默认 success
        return { success: false, error: '自动返工耗尽或决策未处理' };
      } else {
        // 人工确认模式（designing/coding）：原有逻辑
        // 1. 更新状态为执行中
        this.stateManager.updateStage(stageName, StageStatus.RUNNING);

        // 2. 准备阶段输入
        const input = await this.prepareStageInput(stageName, workflowConfig);

        // 3. 执行阶段
        const stageResult = await this.stageExecutor.execute(
          stageName,
          input,
          workflowConfig.projectPath
        );

        if (!stageResult.success) {
          return { success: false, error: stageResult.error };
        }

        // 4. 记录阶段输出
        this.stateManager.setStageOutputs(stageName, stageResult.outputs);

        // 5. 更新状态为待审阅
        this.stateManager.updateStage(stageName, StageStatus.REVIEWING);

        // 6. 执行审阅
        console.log('[Workflow-Orchestrator] 执行审阅...');
        const reviewDecision = await this.reviewOrchestrator.review(
          stageName,
          input,
          stageResult.outputs,
          workflowConfig.projectPath
        );

        // 7. 记录审阅决策
        this.stateManager.recordReviewDecision(
          stageName,
          reviewDecision.decision,
          reviewDecision.notes,
          reviewDecision.fixItems
        );

        // 8. 处理审阅决策
        return await this.handleReviewDecision(stageName, reviewDecision, workflowConfig);
      }

    } catch (error) {
      console.error(`[Workflow-Orchestrator] 阶段 ${stageName} 执行失败:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 准备阶段输入
   * @param {string} stageName - 阶段名称
   * @param {object} workflowConfig - 工作流配置
   * @returns {Promise<object>} 阶段输入
   * @private
   */
  async prepareStageInput(stageName, workflowConfig) {
    const { projectPath, requirementsFile } = workflowConfig;
    
    const input = {
      projectPath,
      requirementsFile: path.join(projectPath, requirementsFile)
    };

    // 根据阶段添加特定输入
    switch (stageName) {
      case Stage.ROADMAPPING:
        input.designingPath = path.join(projectPath, '01_designing');
        input.prdFile = path.join(projectPath, '01_designing/PRD.md');
        input.trdFile = path.join(projectPath, '01_designing/TRD.md');
        
        // 注入 attempt + regenerateHint（自动返工闭环）
        const roadmappingStage = this.stateManager.getStage('roadmapping');
        input.attempt = (roadmappingStage.retryCount || 0) + 1;
        input.regenerateHint = this.stateManager.state.stages.roadmapping.lastRegenerateHint || '';
        break;

      case Stage.DETAILING:
        input.prdFile = path.join(projectPath, '01_designing/PRD.md');
        input.trdFile = path.join(projectPath, '01_designing/TRD.md');
        input.roadmapFile = path.join(projectPath, '02_roadmapping/ROADMAP.md');
        
        // 注入 attempt + regenerateHint（自动返工闭环）
        const detailingStage = this.stateManager.getStage('detailing');
        input.attempt = (detailingStage.retryCount || 0) + 1;
        input.regenerateHint = this.stateManager.state.stages.detailing.lastRegenerateHint || '';
        break;

      case Stage.CODING:
        input.detailFile = path.join(projectPath, '03_detailing/DETAIL.md');
        input.manifestFile = path.join(projectPath, 'PROJECT_MANIFEST.json');
        
        // 注入 attempt + regenerateHint（自动返工闭环）
        const codingStage = this.stateManager.getStage('coding');
        input.attempt = (codingStage.retryCount || 0) + 1;
        input.regenerateHint = this.stateManager.state.stages.coding.lastRegenerateHint || '';
        break;

      case Stage.TESTING:
        input.srcDir = path.join(projectPath, '04_coding/src');
        input.manifestFile = path.join(projectPath, 'PROJECT_MANIFEST.json');
        
        // 注入 attempt + regenerateHint（自动返工闭环）
        const testingStage = this.stateManager.getStage('testing');
        input.attempt = (testingStage.retryCount || 0) + 1;
        input.regenerateHint = this.stateManager.state.stages.testing.lastRegenerateHint || '';
        break;
    }

    return input;
  }

  /**
   * 处理审阅决策
   * @param {string} stageName - 阶段名称
   * @param {object} reviewDecision - 审阅决策
   * @param {object} workflowConfig - 工作流配置
   * @returns {Promise<{success: boolean, error?: string}>}
   * @private
   */
  async handleReviewDecision(stageName, reviewDecision, workflowConfig) {
    console.log('');
    console.log('[Workflow-Orchestrator] 处理审阅决策...');
    console.log(`  结论：${reviewDecision.decision}`);
    console.log(`  待修复项：${reviewDecision.fixItems.length} 项`);
    console.log('');

    switch (reviewDecision.decision) {
      case 'pass':
        console.log('[Workflow-Orchestrator] ✅ 审阅通过，进入下一阶段');
        
        // Designing pass 时写入 approved 快照（roadmapping 入口门禁依赖）
        if (stageName === 'designing') {
          await this.writeDesigningApprovedSnapshot(workflowConfig.projectPath);
        }
        
        return { success: true };

      case 'conditional':
        console.log('[Workflow-Orchestrator] ⚠️ 条件通过，进入下一阶段但需修复');
        console.log('[Workflow-Orchestrator] 待修复项已记录，将在后续版本修复');
        
        // Designing conditional pass 时也写入 approved 快照
        if (stageName === 'designing') {
          await this.writeDesigningApprovedSnapshot(workflowConfig.projectPath);
        }
        
        return { success: true };

      case 'reject':
        // Designing 阶段：进入 BLOCKED（人工返工）
        if (stageName === 'designing') {
          console.log('[Workflow-Orchestrator] ❌ 审阅驳回（designing -> BLOCKED）');
          const reason = reviewDecision.notes || '用户驳回';
          this.stateManager.updateStage(stageName, StageStatus.BLOCKED, { blockReason: reason });
          return { success: false, blocked: true, error: reason };
        }
        
        // 其它阶段：由 executeStage() 内的 while-loop 控制重试
        console.log('[Workflow-Orchestrator] ❌ 审阅驳回');
        return { success: false, error: 'rejected' };

      case 'clarify':
        // Designing 阶段：进入 BLOCKED（可恢复暂停）
        if (stageName === 'designing') {
          console.log('[Workflow-Orchestrator] ❓ 需澄清（designing -> BLOCKED）');
          const reason = reviewDecision.notes || '需要澄清';
          this.stateManager.updateStage(stageName, StageStatus.BLOCKED, { blockReason: reason });
          return { success: false, blocked: true, error: reason };
        }
        
        // 其它阶段：暂停流程
        console.log('[Workflow-Orchestrator] ❓ 需澄清，等待补充信息');
        return { success: false, error: '需要澄清' };

      case 'terminate': {
        const reason = reviewDecision.notes || '审阅终止';
        console.log(`[Workflow-Orchestrator] 🛑 审阅终止：${reason}`);
        this.stateManager.terminate(reason);
        return { success: false, error: reason };
      }

      default:
        return { success: false, error: `未知审阅结论：${reviewDecision.decision}` };
    }
  }

  /**
   * 写入 Designing Approved 快照（roadmapping 入口门禁依赖）
   * @param {string} projectPath - 项目路径
   */
  async writeDesigningApprovedSnapshot(projectPath) {
    console.log('[Workflow-Orchestrator] 写入 designing approved 快照...');
    
    try {
      // 读取文件内容
      const requirementsPath = path.join(projectPath, 'REQUIREMENTS.md');
      const prdPath = path.join(projectPath, '01_designing/PRD.md');
      const trdPath = path.join(projectPath, '01_designing/TRD.md');
      
      const requirementsContent = fs.readFileSync(requirementsPath, 'utf8');
      const prdContent = fs.readFileSync(prdPath, 'utf8');
      const trdContent = fs.readFileSync(trdPath, 'utf8');
      
      // 计算哈希
      const requirementsHash = crypto.createHash('sha256').update(requirementsContent).digest('hex');
      const prdHash = crypto.createHash('sha256').update(prdContent).digest('hex');
      const trdHash = crypto.createHash('sha256').update(trdContent).digest('hex');
      
      // P1-2 修复：只保留 hash + 文件路径，删除全文内容防止 state 膨胀
      this.stateManager.state.stages.designing.approved = {
        requirementsHash,
        prdHash,
        trdHash,
        requirementsPath,
        prdPath,
        trdPath,
        approvedBy: 'openclaw-ouyp',
        approvedAt: new Date().toISOString(),
        transitionId: `DESIGNING_APPROVED_${Date.now()}`
      };
      
      this.stateManager.save();
      
      console.log('[Workflow-Orchestrator] ✅ designing approved 快照已写入');
      console.log(`  - requirementsHash: ${requirementsHash.substring(0, 16)}...`);
      console.log(`  - prdHash: ${prdHash.substring(0, 16)}...`);
      console.log(`  - trdHash: ${trdHash.substring(0, 16)}...`);
      
    } catch (error) {
      console.error('[Workflow-Orchestrator] ❌ 写入 approved 快照失败:', error.message);
      throw error;
    }
  }

  /**
   * 恢复工作流（断点续传）
   * @param {string} projectPath - 项目路径
   * @returns {Promise<object>} 工作流结果
   */
  async resume(projectPath) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ClawDevFlow (CDF) 恢复工作流                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    // 1. 加载现有状态
    this.stateManager = new StateManager(this.config, projectPath);
    console.log(`[Workflow-Orchestrator] 加载工作流状态：${this.stateManager.state.workflowId}`);
    console.log(`[Workflow-Orchestrator] 当前阶段：${this.stateManager.getCurrentStage() || '无'}`);
    console.log('');
    
    // TODO-5 修复：初始化 StageExecutor（传入 stateManager，保证 Gate#2 在断点恢复时仍生效）
    this.stageExecutor = new StageExecutor(this.config, this.stateManager);

    // 2. 从未通过的阶段继续
    const currentIndex = this.stateManager.getCurrentStageIndex();
    
    for (let i = currentIndex; i < STAGE_SEQUENCE.length; i++) {
      const stageName = STAGE_SEQUENCE[i];
      const stage = this.stateManager.getStage(stageName);

      // 如果阶段已通过，跳过
      if (this.stateManager.isStagePassed(stageName)) {
        console.log(`[Workflow-Orchestrator] ⏭️ 跳过已通过阶段：${stageName}`);
        continue;
      }

      if (stage.status === StageStatus.BLOCKED || stage.stageStatus === 'blocked') {
        const reason = stage.blockReason || '阶段被阻断，需人工解除';
        console.log(`[Workflow-Orchestrator] 🛑 阶段 ${stageName} 处于 BLOCKED：${reason}`);
        return { success: false, blocked: true, blockedStage: stageName, error: reason };
      }

      // 执行阶段
      console.log(`[Workflow-Orchestrator] 继续执行阶段：${stageName}`);
      const result = await this.executeStage(stageName, {
        projectPath,
        scenario: this.stateManager.state.metadata.scenario,
        requirementsFile: this.stateManager.state.metadata.requirementsFile
      });

      if (!result.success) {
        return result;
      }
    }

    // 3. 完成工作流
    this.stateManager.complete();
    
    return {
      success: true,
      workflowId: this.stateManager.state.workflowId,
      report: this.stateManager.getReport()
    };
  }
}

module.exports = WorkflowOrchestrator;
