/**
 * Releasing 自动审阅模块
 * 
 * ClawDevFlow (CDF) 审阅系统
 * 负责 Releasing 阶段的自动审阅（Gates RL0-RL3）
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { readJson } = require('../../utils/json');

/**
 * Releasing 自动审阅
 * 
 * Gates:
 * - RL0: readiness 存在且 PASS
 * - RL1: 08_releasing/ 五件套齐全
 * - RL2: CLEANUP_REPORT.json 可解析
 * - RL3: securityFindings 必须为空，否则 reject
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.projectPath - 项目路径
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function review(ctx) {
  const { projectPath } = ctx;
  const releasingPath = path.join(projectPath, '08_releasing');
  const readinessPath = path.join(projectPath, '05_reviewing/RELEASE_READINESS.json');
  
  // Gate RL0: readiness 存在且 PASS
  if (!fs.existsSync(readinessPath)) {
    return {
      decision: 'reject',
      notes: 'RELEASE_READINESS.json 文件不存在',
      fixItems: [{
        id: 'RL0_READINESS_MISSING',
        description: 'RELEASE_READINESS.json 文件不存在',
        suggestion: '请先完成 reviewing 阶段并获得 PASS 放行凭证',
        evidencePath: '05_reviewing/RELEASE_READINESS.json'
      }]
    };
  }
  
  const readiness = readJson(readinessPath);
  if (readiness.result !== 'PASS') {
    return {
      decision: 'reject',
      notes: `Release Readiness 检查结果为 ${readiness.result}，不允许发布`,
      fixItems: (readiness.blockingIssues || []).map(issue => ({
        id: `RL0_READINESS_${issue.gateId}`,
        description: `Reviewing 阻塞项：${issue.description}`,
        suggestion: issue.suggestion,
        evidencePath: issue.evidencePath
      }))
    };
  }
  
  // Gate RL1: 08_releasing/ 五件套齐全
  const requiredFiles = [
    'RELEASE_RECORD.json',
    'RELEASE_NOTES.md',
    'ARTIFACT_MANIFEST.json',
    'CLEANUP_PLAN.json',
    'CLEANUP_REPORT.json'
  ];
  
  const missingFiles = [];
  for (const file of requiredFiles) {
    const filePath = path.join(releasingPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    return {
      decision: 'reject',
      notes: `Releasing 产出文件缺失：${missingFiles.join(', ')}`,
      fixItems: [{
        id: 'RL1_EVIDENCE_MISSING',
        description: `Releasing 产出文件缺失：${missingFiles.join(', ')}`,
        suggestion: '请执行 Releasing 阶段生成完整的发布证据包',
        evidencePath: '08_releasing/'
      }]
    };
  }
  
  // Gate RL2: CLEANUP_REPORT.json 可解析
  const cleanupReportPath = path.join(releasingPath, 'CLEANUP_REPORT.json');
  let cleanupReport;
  try {
    cleanupReport = readJson(cleanupReportPath);
  } catch (error) {
    return {
      decision: 'reject',
      notes: `CLEANUP_REPORT.json 解析失败：${error.message}`,
      fixItems: [{
        id: 'RL2_CLEANUP_REPORT_INVALID',
        description: `CLEANUP_REPORT.json 解析失败：${error.message}`,
        suggestion: '请修复 CLEANUP_REPORT.json 格式',
        evidencePath: '08_releasing/CLEANUP_REPORT.json'
      }]
    };
  }
  
  // Gate RL3: securityFindings 必须为空
  const findings = cleanupReport.securityFindings || [];
  const count = cleanupReport.summary?.totalSecurityFindings ?? findings.length;
  
  if (count > 0 || findings.length > 0) {
    return {
      decision: 'reject',
      notes: `发现 ${count} 个敏感文件，禁止发布`,
      fixItems: findings.map((finding, index) => ({
        id: 'RL3_SECURITY_FINDINGS_FOUND',
        description: `敏感文件：${finding.path || finding.file || `未知文件 ${index + 1}`}`,
        suggestion: '请移除敏感文件或将其添加到 .gitignore',
        evidencePath: '08_releasing/CLEANUP_REPORT.json'
      }))
    };
  }
  
  // 所有 Gates 通过
  return {
    decision: 'pass',
    notes: 'Releasing 检查通过',
    fixItems: []
  };
}

module.exports = { review };
