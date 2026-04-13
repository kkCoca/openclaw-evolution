/**
 * Precommit 自动审阅模块
 * 
 * ClawDevFlow (CDF) 审阅系统
 * 负责 Precommit 阶段的自动审阅（Gates PC0-PC2）
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { readJson } = require('../../utils/json');

/**
 * Precommit 自动审阅
 * 
 * Gates:
 * - PC0: 敏感文件发现 => reject
 * - PC1: 未跟踪文件（不在 allowlist）=> reject
 * - PC2: 08_releasing/ 被 git 跟踪 => reject
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.projectPath - 项目路径
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function review(ctx) {
  const { projectPath } = ctx;
  const runtimeDir = ctx.config?.global?.runtimeDir || '.cdf-work';
  const reportPath = path.join(projectPath, '07_precommit/PRECOMMIT_REPORT.json');
  
  // 检查 PRECOMMIT_REPORT.json 存在
  if (!fs.existsSync(reportPath)) {
    return {
      decision: 'reject',
      notes: 'PRECOMMIT_REPORT.json 文件不存在',
      fixItems: [{
        id: 'PC0_EVIDENCE_MISSING',
        description: 'PRECOMMIT_REPORT.json 文件不存在',
        suggestion: '请执行 precommit 阶段生成完整的证据包',
        evidencePath: '07_precommit/PRECOMMIT_REPORT.json'
      }]
    };
  }
  
  // 读取报告
  let report;
  try {
    report = readJson(reportPath);
  } catch (error) {
    return {
      decision: 'reject',
      notes: `PRECOMMIT_REPORT.json 解析失败：${error.message}`,
      fixItems: [{
        id: 'PC0_REPORT_INVALID',
        description: `PRECOMMIT_REPORT.json 解析失败：${error.message}`,
        suggestion: '请修复 PRECOMMIT_REPORT.json 格式',
        evidencePath: '07_precommit/PRECOMMIT_REPORT.json'
      }]
    };
  }
  
  const blockingIssues = [];
  
  // Gate PC0: 敏感文件发现 => reject
  if (report.securityFindings && report.securityFindings.length > 0) {
    for (const finding of report.securityFindings) {
      blockingIssues.push({
        id: 'PC0',
        description: `敏感文件：${finding.path} (${finding.pattern})`,
        suggestion: '请移除敏感文件或将其添加到 .gitignore',
        evidencePath: '07_precommit/PRECOMMIT_REPORT.json'
      });
    }
  }
  
  // Gate PC1: 未跟踪文件（不在 allowlist）=> reject
  if (report.untrackedFiles && report.untrackedFiles.length > 0) {
    for (const untracked of report.untrackedFiles) {
      if (isRuntimeFile(untracked.path, runtimeDir)) {
        continue;
      }
      blockingIssues.push({
        id: 'PC1',
        description: `未跟踪文件：${untracked.path}`,
        suggestion: untracked.isProtectedDir
          ? `受保护目录内容不应提交，请删除或加入 .gitignore：${untracked.path}`
          : `确认是否应提交；不应提交则删除或加入 .gitignore：${untracked.path}`,
        evidencePath: '07_precommit/PRECOMMIT_REPORT.json'
      });
    }
  }
  
  // Gate PC2: 08_releasing/ 被 git 跟踪 => reject
  const pc2Issues = report.blockingIssues?.filter(i => i.gateId === 'PC2') || [];
  for (const issue of pc2Issues) {
    blockingIssues.push({
      id: 'PC2',
      description: issue.description,
      suggestion: issue.suggestion,
        evidencePath: issue.evidencePath || '08_releasing/'
    });
  }
  
  // 返回决策
  if (blockingIssues.length > 0) {
    return {
      decision: 'reject',
      notes: `Precommit 检查失败：${blockingIssues.length} 个 blocking issue`,
      fixItems: blockingIssues
    };
  }
  
  return {
    decision: 'pass',
    notes: 'Precommit 检查通过，可以安全提交',
    fixItems: []
  };
}

module.exports = { review };

function isRuntimeFile(filePath, runtimeDir) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  const trimmed = normalized.replace(/\/+$/, '');
  const runtimePrefix = `${runtimeDir}/`;
  return (
    trimmed === '.cdf-state.json' ||
    trimmed === runtimeDir ||
    normalized.startsWith(runtimePrefix) ||
    normalized.startsWith('06_testing/') ||
    normalized.startsWith('07_precommit/') ||
    normalized.startsWith('08_releasing/')
  );
}
