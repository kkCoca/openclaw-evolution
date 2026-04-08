/**
 * State Manager (状态管理器)
 * 
 * ClawDevFlow (CDF) 核心组件
 * 负责流程状态的持久化、加载和更新
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * 状态枚举
 */
const StageStatus = {
  PENDING: 'pending',           // 待执行
  RUNNING: 'running',           // 执行中
  REVIEWING: 'reviewing',       // 待审阅
  PASSED: 'passed',             // 通过
  CONDITIONAL_PASSED: 'conditional_passed', // 条件通过
  REJECTED: 'rejected',         // 驳回
  BLOCKED: 'blocked',           // 阻断（可恢复暂停）- TODO-2 新增
  TERMINATED: 'terminated'      // 终止
};

/**
 * 状态管理器
 */
class StateManager {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   * @param {string} projectPath - 项目路径
   */
  constructor(config, projectPath) {
    this.config = config || {};
    this.projectPath = projectPath;
    this.stateFile = path.join(projectPath, '.cdf-state.json');
    this.state = this.loadOrCreateState();
    
    console.log('[State-Manager] 状态管理器初始化完成');
    console.log(`[State-Manager]   项目路径：${projectPath}`);
    console.log(`[State-Manager]   状态文件：${this.stateFile}`);
  }

  /**
   * 加载或创建状态
   * @returns {object} 状态对象
   * @private
   */
  loadOrCreateState() {
    if (fs.existsSync(this.stateFile)) {
      console.log('[State-Manager] 加载现有状态文件');
      const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      return state;
    } else {
      console.log('[State-Manager] 创建新状态文件');
      const state = this.createInitialState();
      this.save();
      return state;
    }
  }

  /**
   * 创建初始状态
   * @returns {object} 初始状态
   * @private
   */
  createInitialState() {
    return {
      workflowId: this.generateWorkflowId(),
      projectPath: this.projectPath,
      currentStage: null,
      status: 'initialized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stages: {
        designing: {
          status: StageStatus.PENDING,
          stageStatus: 'pending',  // 用于入口门禁校验
          retryCount: 0,
          outputs: [],
          reviewDecision: null,
          reviewNotes: '',
          fixItems: [],
          approved: null  // approved 快照
        },
        roadmapping: {
          status: StageStatus.PENDING,
          stageStatus: 'pending',  // 用于入口门禁校验
          retryCount: 0,
          outputs: [],
          reviewDecision: null,
          reviewNotes: '',
          fixItems: [],
          lastRegenerateHint: '',
          lastBlockingIssues: [],
          lastAutoReviewReport: null
        },
        detailing: {
          status: StageStatus.PENDING,
          stageStatus: 'pending',  // 用于入口门禁校验
          retryCount: 0,
          outputs: [],
          reviewDecision: null,
          reviewNotes: '',
          fixItems: [],
          lastRegenerateHint: '',
          lastBlockingIssues: [],
          lastAutoReviewReport: null
        },
        coding: {
          status: StageStatus.PENDING,
          stageStatus: 'pending',  // 用于入口门禁校验
          retryCount: 0,
          outputs: [],
          reviewDecision: null,
          reviewNotes: '',
          fixItems: [],
          lastRegenerateHint: '',
          lastBlockingIssues: [],
          lastAutoReviewReport: null
        },
        testing: {
          status: StageStatus.PENDING,
          retryCount: 0,
          outputs: [],
          reviewDecision: null,
          reviewNotes: '',
          fixItems: []
        },
        reviewing: {
          status: StageStatus.PENDING,
          retryCount: 0,
          outputs: [],
          reviewDecision: null,
          reviewNotes: '',
          fixItems: []
        }
      },
      metadata: {
        scenario: null,
        requirementsFile: null,
        startTime: null,
        endTime: null
      }
    };
  }

  /**
   * 生成工作流 ID
   * @returns {string} 工作流 ID
   * @private
   */
  generateWorkflowId() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `cdf-${date}-${random}`;
  }

  /**
   * 保存状态
   */
  save() {
    if (!this.state) {
      console.log('[State-Manager] ⚠️ 状态对象不存在，无法保存');
      return;
    }
    this.state.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
    console.log(`[State-Manager] ✅ 状态已保存`);
  }

  /**
   * 更新阶段状态
   * @param {string} stageName - 阶段名称
   * @param {string} status - 状态
   * @param {object} data - 附加数据
   */
  updateStage(stageName, status, data = {}) {
    if (!this.state || !this.state.stages || !this.state.stages[stageName]) {
      throw new Error(`未知阶段：${stageName}`);
    }

    console.log(`[State-Manager] 更新阶段状态：${stageName} → ${status}`);
    
    this.state.stages[stageName].status = status;
    this.state.stages[stageName].updatedAt = new Date().toISOString();
    
    // 同步更新 stageStatus（用于入口门禁校验）
    const statusMap = {
      [StageStatus.PENDING]: 'pending',
      [StageStatus.RUNNING]: 'running',
      [StageStatus.REVIEWING]: 'reviewing',
      [StageStatus.PASSED]: 'passed',
      [StageStatus.CONDITIONAL_PASSED]: 'conditional_passed',
      [StageStatus.REJECTED]: 'rejected',
      [StageStatus.BLOCKED]: 'blocked',  // TODO-2 新增
      [StageStatus.TERMINATED]: 'terminated'
    };
    this.state.stages[stageName].stageStatus = statusMap[status] || status;
    
    // 合并附加数据
    Object.assign(this.state.stages[stageName], data);
    
    this.state.currentStage = stageName;
    this.save();
  }

  /**
   * 设置阶段输出
   * @param {string} stageName - 阶段名称
   * @param {Array} outputs - 输出文件列表
   */
  setStageOutputs(stageName, outputs) {
    this.state.stages[stageName].outputs = outputs;
    this.save();
  }

  /**
   * 记录审阅决策
   * @param {string} stageName - 阶段名称
   * @param {string} decision - 审阅结论
   * @param {string|object} notes - 审阅意见或 v2.0 审阅报告
   * @param {Array} fixItems - 待修复项
   */
  recordReviewDecision(stageName, decision, notes = '', fixItems = []) {
    this.state.stages[stageName].reviewDecision = decision;
    
    // 支持 v2.0 审阅报告
    if (typeof notes === 'object' && notes !== null) {
      // v2.0 审阅报告
      this.state.stages[stageName].reviewReport = notes;
      this.state.stages[stageName].reviewNotes = this.formatV2ReviewNotes(notes);
    } else {
      // v1.0 审阅意见
      this.state.stages[stageName].reviewNotes = notes;
    }
    
    this.state.stages[stageName].fixItems = fixItems;
    
    // 根据审阅结论更新状态
    // P0#1 修复：删除 retryCount++，统一交给 while-loop 控制（避免重复自增）
    switch (decision) {
      case 'pass':
        this.state.stages[stageName].status = StageStatus.PASSED;
        break;
      case 'conditional':
        this.state.stages[stageName].status = StageStatus.CONDITIONAL_PASSED;
        break;
      case 'reject':
        this.state.stages[stageName].status = StageStatus.REJECTED;
        // retryCount++ 已删除，由 while-loop 手动控制
        break;
      case 'clarify':
        this.state.stages[stageName].status = StageStatus.REVIEWING; // 保持待审阅状态
        break;
    }
    
    this.save();
  }
  
  /**
   * 格式化 v2.0 审阅报告为文本
   * @param {object} report - v2.0 审阅报告
   * @returns {string} 格式化后的文本
   */
  formatV2ReviewNotes(report) {
    const notes = [];
    
    // Freshness Gate
    if (report.gates?.freshness) {
      notes.push(`Freshness Gate: ${report.gates.freshness.passed ? '✅' : '❌'}`);
      if (!report.gates.freshness.passed) {
        notes.push(`  - ${report.gates.freshness.reason}`);
      }
    }
    
    // Traceability Gate
    if (report.gates?.traceability) {
      notes.push(`Traceability Gate: ${report.gates.traceability.passed ? '✅' : '❌'}`);
      if (!report.gates.traceability.passed) {
        notes.push(`  - ${report.gates.traceability.reason}`);
      }
    }
    
    // 综合评分
    notes.push(`综合评分：${report.overall?.score || 0}/100`);
    notes.push(`审阅结论：${report.overall?.recommendation || 'unknown'}`);
    
    return notes.join('\n');
  }
  
  /**
   * 设置审阅报告（v2.0）
   * @param {string} stageName - 阶段名称
   * @param {object} report - v2.0 审阅报告
   */
  setReviewReport(stageName, report) {
    this.state.stages[stageName].reviewReport = report;
    this.save();
  }
  
  /**
   * 添加待修复项
   * @param {string} stageName - 阶段名称
   * @param {Array} items - 待修复项列表
   */
  addFixItems(stageName, items) {
    if (!this.state.stages[stageName].fixItems) {
      this.state.stages[stageName].fixItems = [];
    }
    this.state.stages[stageName].fixItems.push(...items);
    this.save();
  }

  /**
   * 获取阶段状态
   * @param {string} stageName - 阶段名称
   * @returns {object} 阶段状态
   */
  getStage(stageName) {
    return this.state.stages[stageName];
  }

  /**
   * 获取当前阶段
   * @returns {string|null} 当前阶段名称
   */
  getCurrentStage() {
    return this.state.currentStage;
  }

  /**
   * 获取当前阶段索引
   * @returns {number} 阶段索引
   */
  getCurrentStageIndex() {
    const stages = ['designing', 'roadmapping', 'detailing', 'coding', 'testing', 'reviewing'];
    const current = this.state.currentStage;
    
    if (!current) {
      return 0;
    }
    
    const index = stages.indexOf(current);
    return index >= 0 ? index : 0;
  }

  /**
   * 检查阶段是否通过
   * @param {string} stageName - 阶段名称
   * @returns {boolean} 是否通过
   */
  isStagePassed(stageName) {
    const stage = this.state.stages[stageName];
    return stage.status === StageStatus.PASSED || 
           stage.status === StageStatus.CONDITIONAL_PASSED;
  }

  /**
   * 获取所有待修复项
   * @returns {Array} 待修复项列表
   */
  getAllFixItems() {
    const allFixItems = [];
    
    for (const [stageName, stage] of Object.entries(this.state.stages)) {
      if (stage.fixItems && stage.fixItems.length > 0) {
        allFixItems.push(...stage.fixItems.map(item => ({
          ...item,
          stage: stageName
        })));
      }
    }
    
    return allFixItems;
  }

  /**
   * 获取状态报告
   * @returns {object} 状态报告
   */
  getReport() {
    const stages = this.state.stages;
    const passedCount = Object.values(stages).filter(
      s => s.status === StageStatus.PASSED || s.status === StageStatus.CONDITIONAL_PASSED
    ).length;
    
    const totalFixItems = this.getAllFixItems().length;
    
    return {
      workflowId: this.state.workflowId,
      projectPath: this.state.projectPath,
      status: this.state.status,
      currentStage: this.state.currentStage,
      progress: {
        total: 6,
        passed: passedCount,
        percentage: Math.round((passedCount / 6) * 100)
      },
      totalFixItems,
      createdAt: this.state.createdAt,
      updatedAt: this.state.updatedAt
    };
  }

  /**
   * 设置工作流元数据
   * @param {object} metadata - 元数据
   */
  setMetadata(metadata) {
    Object.assign(this.state.metadata, metadata);
    this.save();
  }

  /**
   * 完成工作流
   */
  complete() {
    this.state.status = 'completed';
    this.state.metadata.endTime = new Date().toISOString();
    this.save();
    console.log('[State-Manager] ✅ 工作流已完成');
  }

  /**
   * 终止工作流
   * @param {string} reason - 终止原因
   */
  terminate(reason) {
    this.state.status = 'terminated';
    this.state.metadata.terminateReason = reason;
    this.state.metadata.endTime = new Date().toISOString();
    this.save();
    console.log(`[State-Manager] ⚠️ 工作流已终止：${reason}`);
  }
}

module.exports = StateManager;
module.exports.StageStatus = StageStatus;
