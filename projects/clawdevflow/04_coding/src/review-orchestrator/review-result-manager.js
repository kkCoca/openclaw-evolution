/**
 * Review Result Manager (审阅结果管理器)
 * 
 * ClawDevFlow (CDF) 审阅系统组件
 * 负责审阅结果的持久化和加载
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

class ReviewResultManager {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config || {};
    this.reviewResultsDir = path.join(__dirname, 'review-results');
    
    // 确保目录存在
    if (!fs.existsSync(this.reviewResultsDir)) {
      fs.mkdirSync(this.reviewResultsDir, { recursive: true });
      console.log('[Review-Result] 创建审阅结果目录:', this.reviewResultsDir);
    }
    
    console.log('[Review-Result] 审阅结果管理器初始化完成');
  }

  /**
   * 保存审阅结果
   * 
   * @param {string} workflowId - 工作流 ID
   * @param {string} stageName - 阶段名称
   * @param {object} reviewResult - 审阅结果
   * @returns {string} 保存的文件路径
   * 
   * @example
   * ```javascript
   * manager.save('wf-20260331-001', 'designing', {
   *   decision: 'pass',
   *   notes: '整体质量良好',
   *   fixItems: [],
   *   score: { overall: 92 }
   * });
   * ```
   */
  save(workflowId, stageName, reviewResult) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${workflowId}-${stageName}-${timestamp}.json`;
    const filePath = path.join(this.reviewResultsDir, filename);
    
    const resultData = {
      workflowId,
      stage: stageName,
      ...reviewResult,
      savedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(resultData, null, 2), 'utf-8');
    console.log(`[Review-Result] ✅ 审阅结果已保存：${filename}`);
    
    return filePath;
  }

  /**
   * 加载工作流的审阅结果
   * 
   * @param {string} workflowId - 工作流 ID
   * @returns {Array} 审阅结果列表
   */
  loadByWorkflow(workflowId) {
    const results = [];
    
    if (!fs.existsSync(this.reviewResultsDir)) {
      return results;
    }
    
    const files = fs.readdirSync(this.reviewResultsDir);
    
    for (const file of files) {
      if (file.startsWith(workflowId)) {
        const filePath = path.join(this.reviewResultsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        results.push(JSON.parse(content));
      }
    }
    
    // 按时间排序
    results.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));
    
    console.log(`[Review-Result] 加载到 ${results.length} 个审阅结果`);
    return results;
  }

  /**
   * 获取阶段的最新审阅结果
   * 
   * @param {string} workflowId - 工作流 ID
   * @param {string} stageName - 阶段名称
   * @returns {object|null} 审阅结果
   */
  getLatestByStage(workflowId, stageName) {
    const results = this.loadByWorkflow(workflowId);
    
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].stage === stageName) {
        return results[i];
      }
    }
    
    return null;
  }

  /**
   * 检查阶段是否已通过审阅
   * 
   * @param {string} workflowId - 工作流 ID
   * @param {string} stageName - 阶段名称
   * @returns {boolean} 是否通过
   */
  isStagePassed(workflowId, stageName) {
    const result = this.getLatestByStage(workflowId, stageName);
    
    if (!result) {
      return false;
    }
    
    return result.decision === 'pass' || result.decision === 'conditional';
  }

  /**
   * 获取所有待修复项
   * 
   * @param {string} workflowId - 工作流 ID
   * @returns {Array} 待修复项列表
   */
  getAllFixItems(workflowId) {
    const results = this.loadByWorkflow(workflowId);
    const allFixItems = [];
    
    for (const result of results) {
      if (result.fixItems && result.fixItems.length > 0) {
        allFixItems.push(...result.fixItems.map(item => ({
          ...item,
          stage: result.stage,
          reviewDecision: result.decision
        })));
      }
    }
    
    return allFixItems;
  }

  /**
   * 生成审阅报告
   * 
   * @param {string} workflowId - 工作流 ID
   * @returns {object} 审阅报告
   */
  generateReport(workflowId) {
    const results = this.loadByWorkflow(workflowId);
    
    const report = {
      workflowId,
      totalReviews: results.length,
      stages: {},
      passedStages: 0,
      totalFixItems: 0,
      averageScore: 0
    };
    
    let scoreSum = 0;
    let scoreCount = 0;
    
    for (const result of results) {
      const stage = result.stage;
      
      if (!report.stages[stage]) {
        report.stages[stage] = {
          reviews: 0,
          passed: false,
          fixItems: []
        };
      }
      
      report.stages[stage].reviews++;
      report.stages[stage].latestDecision = result.decision;
      
      if (result.decision === 'pass' || result.decision === 'conditional') {
        report.stages[stage].passed = true;
        report.passedStages++;
      }
      
      if (result.fixItems) {
        report.stages[stage].fixItems.push(...result.fixItems);
        report.totalFixItems += result.fixItems.length;
      }
      
      if (result.score && result.score.overall) {
        scoreSum += result.score.overall;
        scoreCount++;
      }
    }
    
    report.averageScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
    
    return report;
  }
}

module.exports = ReviewResultManager;
