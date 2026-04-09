/**
 * Roadmapping 自动审阅模块
 * 
 * ClawDevFlow (CDF) 审阅系统
 * 负责 Roadmapping 阶段的自动审阅（基于 ReviewRoadmapAgentV1）
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { existsNonEmpty } = require('../../utils/fsx');

/**
 * Roadmapping 自动审阅
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.projectPath - 项目路径
 * @param {object} ctx.input - 阶段输入
 * @param {object} ctx.agents - 审阅代理（包含 roadmapping）
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function review(ctx) {
  const { projectPath, input, agents } = ctx;
  const agent = agents.roadmapping;
  
  // 从文件系统读取 ROADMAP.md
  const roadmapPath = path.join(projectPath, '02_roadmapping/ROADMAP.md');
  
  if (!fs.existsSync(roadmapPath)) {
    return {
      decision: 'reject',
      notes: 'ROADMAP.md 文件不存在',
      fixItems: [{
        id: 'ROADMAP_MISSING',
        description: 'ROADMAP.md 文件不存在',
        suggestion: '请重新生成 02_roadmapping/ROADMAP.md，确保文件存在且内容非空'
      }]
    };
  }
  
  const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');
  
  // 空内容判空
  if (!roadmapContent || roadmapContent.trim().length === 0) {
    return {
      decision: 'reject',
      notes: 'ROADMAP.md 文件存在但内容为空',
      fixItems: [{
        id: 'ROADMAP_EMPTY',
        description: 'ROADMAP.md 文件存在但内容为空',
        suggestion: '请重新生成 ROADMAP.md，确保包含目标/范围/里程碑/验收标准等最小内容'
      }]
    };
  }
  
  input.roadmapContent = roadmapContent;
  
  // 执行审阅
  const report = await agent.executeReview(input);
  
  // 转换审阅报告为 decision
  if (report.error) {
    return {
      decision: 'reject',
      notes: `审阅执行错误：${report.error}`,
      fixItems: [{
        id: 'ROADMAP_REVIEW_ERROR',
        description: `审阅执行错误：${report.error}`,
        suggestion: '请修复导致审阅执行错误的问题，并重新生成 ROADMAP.md'
      }]
    };
  }
  
  if (report.overall.recommendation === 'pass') {
    return {
      decision: 'pass',
      notes: '所有检查通过',
      fixItems: []
    };
  }
  
  // 收集 blocking issues
  const blockingIssues = [];
  
  if (!report.gates.traceability?.passed) {
    blockingIssues.push({
      id: 'TRACEABILITY_FAILED',
      description: report.gates.traceability.reason,
      suggestion: report.gates.traceability.suggestion
    });
  }
  
  if (!report.gates.structure?.passed) {
    blockingIssues.push({
      id: 'STRUCTURE_FAILED',
      description: report.gates.structure.reason,
      suggestion: report.gates.structure.suggestion
    });
  }
  
  if (!report.qualityChecks.scope?.passed) {
    blockingIssues.push({
      id: 'SCOPE_FAILED',
      description: report.qualityChecks.scope.issues?.[0],
      suggestion: report.qualityChecks.scope.suggestions?.[0]
    });
  }
  
  return {
    decision: 'reject',
    notes: `自动审阅失败：${blockingIssues.length} 个 blocking issue`,
    fixItems: blockingIssues.map(issue => ({
      id: issue.id,
      description: issue.description,
      suggestion: issue.suggestion
    }))
  };
}

module.exports = {
  review
};
