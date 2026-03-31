/**
 * 状态管理器 (State Manager)
 * 
 * 负责流程引擎的状态持久化、恢复和查询
 * 支持断点续传、回滚和状态追溯
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const fs = require('fs');
const path = require('path');

// 状态枚举
const StageStatus = {
  PENDING: 'pending',           // 待执行
  RUNNING: 'running',           // 执行中
  REVIEWING: 'reviewing',       // 待审阅
  PASSED: 'passed',             // 通过
  CONDITIONAL_PASSED: 'conditional_passed', // 条件通过
  REJECTED: 'rejected',         // 驳回（重新执行）
  TERMINATED: 'terminated'      // 终止（用户主动停止）
};

// 审阅结论枚举
const ReviewDecision = {
  PASS: 'pass',
  CONDITIONAL: 'conditional',
  REJECT: 'reject',
  CLARIFY: 'clarify',
  TERMINATE: 'terminate'
};

class StateManager {
  /**
   * 构造函数
   * @param {string} stateFile - 状态文件路径
   * @param {string} logDir - 日志目录
   */
  constructor(stateFile = './state.json', logDir = './logs') {
    this.stateFile = stateFile;
    this.logDir = logDir;
    this.state = null;
    
    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 初始化新流程状态
   * @param {string} workflowId - 流程 ID
   * @param {string} task - 任务描述
   * @param {string} scenario - 场景类型（全新功能/增量需求/问题修复）
   * @param {string} projectPath - 项目路径
   * @returns {object} 初始状态
   */
  init(workflowId, task, scenario, projectPath) {
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    
    this.state = {
      workflowId,
      task,
      scenario,
      projectPath,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStage: 'designing',
      status: StageStatus.RUNNING,
      retries: {
        total: 0,
        perStage: {}
      },
      stages: {}
    };
    
    // 初始化各阶段状态
    stages.forEach(stage => {
      this.state.stages[stage] = {
        status: StageStatus.PENDING,
        sessionId: null,
        outputs: [],
        reviewDecision: null,
        reviewedAt: null,
        reviewerNotes: '',
        startedAt: null,
        completedAt: null,
        retryCount: 0
      };
    });
    
    this.save();
    this.log('workflow_started', { task, scenario, projectPath });
    
    return this.state;
  }

  /**
   * 加载现有状态（支持断点续传）
   * @returns {object|null} 状态对象，不存在则返回 null
   */
  load() {
    if (!fs.existsSync(this.stateFile)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(this.stateFile, 'utf8');
      this.state = JSON.parse(content);
      this.log('state_loaded', { workflowId: this.state.workflowId });
      return this.state;
    } catch (error) {
      this.log('state_load_error', { error: error.message });
      return null;
    }
  }

  /**
   * 保存状态到文件
   */
  save() {
    if (!this.state) {
      throw new Error('状态未初始化');
    }
    
    this.state.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf8');
  }

  /**
   * 更新阶段状态
   * @param {string} stageName - 阶段名称
   * @param {string} status - 新状态
   * @param {object} updates - 其他更新字段
   */
  updateStage(stageName, status, updates = {}) {
    if (!this.state || !this.state.stages[stageName]) {
      throw new Error(`阶段 ${stageName} 不存在`);
    }
    
    const stage = this.state.stages[stageName];
    stage.status = status;
    stage.updatedAt = new Date().toISOString();
    
    // 合并其他更新字段
    Object.assign(stage, updates);
    
    // 更新当前阶段
    if (status === StageStatus.RUNNING) {
      this.state.currentStage = stageName;
      stage.startedAt = new Date().toISOString();
    }
    
    if (status === StageStatus.PASSED || status === StageStatus.CONDITIONAL_PASSED) {
      stage.completedAt = new Date().toISOString();
    }
    
    this.save();
    this.log('stage_updated', { stage: stageName, status, updates });
  }

  /**
   * 设置阶段会话 ID
   * @param {string} stageName - 阶段名称
   * @param {string} sessionId - 会话 ID
   */
  setSessionId(stageName, sessionId) {
    this.updateStage(stageName, this.state.stages[stageName].status, { sessionId });
  }

  /**
   * 添加阶段输出
   * @param {string} stageName - 阶段名称
   * @param {string[]} outputs - 输出文件列表
   */
  addOutputs(stageName, outputs) {
    const stage = this.state.stages[stageName];
    stage.outputs = [...new Set([...stage.outputs, ...outputs])];
    this.save();
    this.log('outputs_added', { stage: stageName, outputs });
  }

  /**
   * 记录审阅结论
   * @param {string} stageName - 阶段名称
   * @param {string} decision - 审阅结论（pass/conditional/reject/clarify）
   * @param {string} notes - 审阅备注
   */
  recordReviewDecision(stageName, decision, notes = '') {
    this.updateStage(stageName, StageStatus.REVIEWING, {
      reviewDecision: decision,
      reviewerNotes: notes,
      reviewedAt: new Date().toISOString()
    });
    this.log('review_decision', { stage: stageName, decision, notes });
  }

  /**
   * 处理审阅结论
   * @param {string} stageName - 阶段名称
   * @param {string} decision - 审阅结论
   * @returns {object} 决策结果 { action: 'continue'|'retry'|'terminate', nextStage?: string }
   */
  handleReviewDecision(stageName, decision) {
    const stage = this.state.stages[stageName];
    
    switch (decision) {
      case ReviewDecision.PASS:
        this.updateStage(stageName, StageStatus.PASSED);
        return { action: 'continue' };
        
      case ReviewDecision.CONDITIONAL:
        this.updateStage(stageName, StageStatus.CONDITIONAL_PASSED);
        return { action: 'continue' };
        
      case ReviewDecision.REJECT:
        const retryCount = (stage.retryCount || 0) + 1;
        const maxRetries = 3; // 可从配置读取
        
        if (retryCount >= maxRetries) {
          this.updateStage(stageName, StageStatus.TERMINATED, { retryCount });
          return { action: 'terminate', reason: '超过最大重试次数' };
        }
        
        this.updateStage(stageName, StageStatus.REJECTED, {
          retryCount,
          status: StageStatus.PENDING // 重置为待执行
        });
        this.state.retries.total += 1;
        this.state.retries.perStage[stageName] = retryCount;
        this.save();
        
        return { action: 'retry', stage: stageName };
        
      case ReviewDecision.CLARIFY:
        // 保持 REVIEWING 状态，等待澄清
        return { action: 'wait' };
        
      case ReviewDecision.TERMINATE:
        this.state.status = StageStatus.TERMINATED;
        this.updateStage(stageName, StageStatus.TERMINATED);
        this.save();
        return { action: 'terminate', reason: '用户主动终止' };
        
      default:
        throw new Error(`未知的审阅结论：${decision}`);
    }
  }

  /**
   * 获取下一阶段名称
   * @returns {string|null} 下一阶段名称，已是最后阶段则返回 null
   */
  getNextStage() {
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    const currentIndex = stages.indexOf(this.state.currentStage);
    
    if (currentIndex < 0 || currentIndex >= stages.length - 1) {
      return null;
    }
    
    return stages[currentIndex + 1];
  }

  /**
   * 检查流程是否完成
   * @returns {boolean}
   */
  isCompleted() {
    const lastStage = this.state.stages['reviewing'];
    return lastStage.status === StageStatus.PASSED || 
           lastStage.status === StageStatus.CONDITIONAL_PASSED;
  }

  /**
   * 检查流程是否终止
   * @returns {boolean}
   */
  isTerminated() {
    return this.state.status === StageStatus.TERMINATED;
  }

  /**
   * 获取状态摘要（用于展示）
   * @returns {object}
   */
  getSummary() {
    const summary = {
      workflowId: this.state.workflowId,
      task: this.state.task,
      scenario: this.state.scenario,
      status: this.state.status,
      currentStage: this.state.currentStage,
      startedAt: this.state.startedAt,
      updatedAt: this.state.updatedAt,
      progress: {}
    };
    
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    let completedCount = 0;
    
    stages.forEach(stage => {
      const s = this.state.stages[stage];
      summary.progress[stage] = {
        status: s.status,
        retryCount: s.retryCount || 0,
        reviewedAt: s.reviewedAt
      };
      
      if (s.status === StageStatus.PASSED || s.status === StageStatus.CONDITIONAL_PASSED) {
        completedCount++;
      }
    });
    
    summary.progressPercentage = Math.round((completedCount / stages.length) * 100);
    
    return summary;
  }

  /**
   * 记录日志
   * @param {string} event - 事件类型
   * @param {object} details - 详细信息
   */
  log(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      workflowId: this.state?.workflowId || 'unknown',
      stage: details.stage || this.state?.currentStage || 'unknown',
      event,
      details
    };
    
    const logFile = path.join(this.logDir, `${this.state?.workflowId || 'unknown'}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine, 'utf8');
  }

  /**
   * 重置流程（用于完全重启）
   */
  reset() {
    if (!this.state) {
      throw new Error('状态未初始化');
    }
    
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'reviewing'];
    
    this.state.status = StageStatus.RUNNING;
    this.state.currentStage = 'designing';
    this.state.startedAt = new Date().toISOString();
    this.state.updatedAt = new Date().toISOString();
    this.state.retries = { total: 0, perStage: {} };
    
    stages.forEach(stage => {
      this.state.stages[stage] = {
        status: StageStatus.PENDING,
        sessionId: null,
        outputs: [],
        reviewDecision: null,
        reviewedAt: null,
        reviewerNotes: '',
        startedAt: null,
        completedAt: null,
        retryCount: 0
      };
    });
    
    this.save();
    this.log('workflow_reset', {});
  }
}

// 导出
module.exports = {
  StateManager,
  StageStatus,
  ReviewDecision
};
