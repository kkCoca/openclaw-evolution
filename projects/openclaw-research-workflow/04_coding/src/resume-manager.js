/**
 * 断点续传管理器 (Resume Manager)
 * 
 * 支持流程中断后从中断点继续执行
 * 自动检测状态、验证完整性、恢复执行
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const fs = require('fs');
const path = require('path');
const { StateManager, StageStatus } = require('./state-manager');

/**
 * 断点续传管理器类
 */
class ResumeManager {
  /**
   * 构造函数
   * @param {string} stateFile - 状态文件路径
   * @param {string} projectPath - 项目路径
   */
  constructor(stateFile, projectPath) {
    this.stateManager = new StateManager(stateFile);
    this.projectPath = projectPath;
  }

  /**
   * 检查是否可以恢复
   * @returns {Promise<object>} 恢复检查结果
   */
  async checkResume() {
    const state = this.stateManager.load();

    if (!state) {
      return {
        canResume: false,
        reason: '未找到现有流程状态',
        suggestion: '请重新启动流程'
      };
    }

    // 检查流程是否已完成
    if (this.stateManager.isCompleted()) {
      return {
        canResume: false,
        reason: '流程已完成',
        suggestion: '无需恢复，可重新开始或查看结果'
      };
    }

    // 检查流程是否已终止
    if (this.stateManager.isTerminated()) {
      return {
        canResume: false,
        reason: '流程已终止',
        suggestion: '如需继续，请重新启动流程'
      };
    }

    // 检查输出文件完整性
    const fileCheck = await this.checkOutputFiles(state);

    if (!fileCheck.valid) {
      return {
        canResume: false,
        reason: '输出文件不完整',
        details: fileCheck.missing,
        suggestion: '请检查项目目录或重新启动流程'
      };
    }

    // 可以恢复
    return {
      canResume: true,
      currentStage: state.currentStage,
      completedStages: this.getCompletedStages(state),
      suggestion: `可以从 ${state.currentStage} 阶段继续`
    };
  }

  /**
   * 检查输出文件完整性
   * @param {object} state - 状态对象
   * @returns {Promise<object>} 检查结果
   */
  async checkOutputFiles(state) {
    const missing = [];

    for (const [stageName, stage] of Object.entries(state.stages)) {
      if (stage.status === StageStatus.PASSED || 
          stage.status === StageStatus.CONDITIONAL_PASSED) {
        
        // 检查每个阶段的输出文件
        for (const outputFile of stage.outputs || []) {
          const filePath = path.join(this.projectPath, outputFile);
          
          if (!fs.existsSync(filePath)) {
            missing.push({
              stage: stageName,
              file: outputFile,
              path: filePath
            });
          }
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * 获取已完成的阶段
   * @param {object} state - 状态对象
   * @returns {string[]} 已完成阶段列表
   */
  getCompletedStages(state) {
    const completed = [];
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];

    for (const stage of stages) {
      if (state.stages[stage]?.status === StageStatus.PASSED ||
          state.stages[stage]?.status === StageStatus.CONDITIONAL_PASSED) {
        completed.push(stage);
      }
    }

    return completed;
  }

  /**
   * 恢复流程
   * @returns {Promise<object>} 恢复后的状态
   */
  async resume() {
    const checkResult = await this.checkResume();

    if (!checkResult.canResume) {
      throw new Error(`无法恢复流程：${checkResult.reason}`);
    }

    const state = this.stateManager.load();
    
    // 重置当前阶段状态为待执行
    const currentStage = state.currentStage;
    state.stages[currentStage].status = StageStatus.PENDING;
    state.stages[currentStage].retryCount = (state.stages[currentStage].retryCount || 0) + 1;
    
    // 保存状态
    this.stateManager.save();

    // 记录日志
    this.stateManager.log('workflow_resumed', {
      stage: currentStage,
      retryCount: state.stages[currentStage].retryCount
    });

    return {
      workflowId: state.workflowId,
      currentStage: currentStage,
      completedStages: this.getCompletedStages(state),
      message: `流程已恢复，从 ${currentStage} 阶段继续`
    };
  }

  /**
   * 从指定阶段恢复（高级功能）
   * @param {string} stageName - 阶段名称
   * @returns {Promise<object>} 恢复后的状态
   */
  async resumeFromStage(stageName) {
    const validStages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    
    if (!validStages.includes(stageName)) {
      throw new Error(`无效的阶段名称：${stageName}`);
    }

    const state = this.stateManager.load();
    
    if (!state) {
      throw new Error('未找到现有流程状态');
    }

    // 重置指定阶段及后续阶段
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    const startIndex = stages.indexOf(stageName);

    for (let i = startIndex; i < stages.length; i++) {
      const s = stages[i];
      state.stages[s].status = StageStatus.PENDING;
      state.stages[s].sessionId = null;
      state.stages[s].reviewDecision = null;
    }

    state.currentStage = stageName;
    this.stateManager.save();

    this.stateManager.log('workflow_resumed_from_stage', {
      stage: stageName
    });

    return {
      workflowId: state.workflowId,
      currentStage: stageName,
      message: `流程已从 ${stageName} 阶段恢复`
    };
  }

  /**
   * 回滚到指定阶段
   * @param {string} stageName - 阶段名称
   * @returns {Promise<object>} 回滚后的状态
   */
  async rollbackToStage(stageName) {
    const validStages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    
    if (!validStages.includes(stageName)) {
      throw new Error(`无效的阶段名称：${stageName}`);
    }

    const state = this.stateManager.load();
    
    if (!state) {
      throw new Error('未找到现有流程状态');
    }

    // 回滚指定阶段及后续阶段
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    const startIndex = stages.indexOf(stageName);

    for (let i = startIndex; i < stages.length; i++) {
      const s = stages[i];
      state.stages[s].status = StageStatus.PENDING;
      state.stages[s].sessionId = null;
      state.stages[s].outputs = [];
      state.stages[s].reviewDecision = null;
      state.stages[s].reviewedAt = null;
      state.stages[s].reviewerNotes = '';
    }

    state.currentStage = stageName;
    this.stateManager.save();

    this.stateManager.log('workflow_rolled_back', {
      stage: stageName
    });

    return {
      workflowId: state.workflowId,
      currentStage: stageName,
      message: `流程已回滚到 ${stageName} 阶段`
    };
  }

  /**
   * 获取流程摘要
   * @returns {object} 流程摘要
   */
  getSummary() {
    return this.stateManager.getSummary();
  }

  /**
   * 导出流程历史
   * @returns {object} 流程历史
   */
  exportHistory() {
    const state = this.stateManager.load();
    
    if (!state) {
      return null;
    }

    const history = {
      workflowId: state.workflowId,
      task: state.task,
      scenario: state.scenario,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
      stages: {}
    };

    for (const [stageName, stage] of Object.entries(state.stages)) {
      history.stages[stageName] = {
        status: stage.status,
        outputs: stage.outputs,
        reviewDecision: stage.reviewDecision,
        reviewerNotes: stage.reviewerNotes,
        retryCount: stage.retryCount,
        startedAt: stage.startedAt,
        completedAt: stage.completedAt
      };
    }

    return history;
  }
}

/**
 * 自动检测并恢复（便捷函数）
 * @param {string} stateFile - 状态文件路径
 * @param {string} projectPath - 项目路径
 * @returns {Promise<object>} 恢复结果
 */
async function autoResume(stateFile, projectPath) {
  const resumeManager = new ResumeManager(stateFile, projectPath);
  return await resumeManager.checkResume();
}

// 导出
module.exports = {
  ResumeManager,
  autoResume
};
