/**
 * Auto-Review 执行器（Phase 2 过渡版）
 * 
 * 包含所有 7 个阶段的自动审阅逻辑
 * 后续将拆分为独立的 7 个模块
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');

/**
 * 执行自动审阅
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.stageName - 阶段名称
 * @param {object} ctx.input - 阶段输入
 * @param {string} ctx.projectPath - 项目路径
 * @param {object} ctx.agents - 审阅代理
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function executeAutoReview(ctx) {
  const { stageName, input, projectPath, agents } = ctx;
  
  if (stageName === 'roadmapping') {
    return await reviewRoadmapping(input, projectPath, agents.roadmapping);
  } else if (stageName === 'detailing') {
    return await reviewDetailing(input, projectPath);
  } else if (stageName === 'coding') {
    return await reviewCoding(input, projectPath);
  } else if (stageName === 'testing') {
    return await reviewTesting(input, projectPath);
  } else if (stageName === 'reviewing') {
    return await reviewReviewing(input, projectPath);
  } else if (stageName === 'precommit') {
    return await reviewPrecommit(input, projectPath);
  } else if (stageName === 'releasing') {
    return await reviewReleasing(input, projectPath);
  }
  
  throw new Error(`未知阶段：${stageName}`);
}

/**
 * Roadmapping 自动审阅
 */
async function reviewRoadmapping(input, projectPath, agent) {
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
  const report = await agent.executeReview(input);
  
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
    return { decision: 'pass', notes: '所有检查通过', fixItems: [] };
  }
  
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

/**
 * Detailing 自动审阅
 */
async function reviewDetailing(input, projectPath) {
  const detailPath = path.join(projectPath, '03_detailing/DETAIL.md');
  
  if (!fs.existsSync(detailPath)) {
    return {
      decision: 'reject',
      notes: 'DETAIL.md 文件不存在',
      fixItems: [{
        id: 'FILE_MISSING',
        description: 'DETAIL.md 文件不存在',
        suggestion: '请生成 DETAIL.md 文件'
      }]
    };
  }
  
  const detailContent = fs.readFileSync(detailPath, 'utf8');
  
  if (!detailContent || detailContent.trim().length === 0) {
    return {
      decision: 'reject',
      notes: 'DETAIL.md 文件存在但内容为空',
      fixItems: [{
        id: 'FILE_EMPTY',
        description: 'DETAIL.md 文件存在但内容为空',
        suggestion: '请生成 DETAIL.md 内容'
      }]
    };
  }
  
  const requiredKeywords = [
    { id: 'interface', keywords: ['接口', 'API'], name: '接口设计' },
    { id: 'data', keywords: ['数据结构', 'Schema', '数据模型'], name: '数据结构' },
    { id: 'test', keywords: ['测试', 'Test'], name: '测试方案' },
    { id: 'error', keywords: ['异常', 'Error', '错误处理'], name: '异常处理' }
  ];
  
  const missingKeywords = [];
  for (const req of requiredKeywords) {
    const hasKeyword = req.keywords.some(kw => detailContent.includes(kw));
    if (!hasKeyword) {
      missingKeywords.push(req.name);
    }
  }
  
  if (missingKeywords.length > 0) {
    return {
      decision: 'reject',
      notes: `DETAIL.md 缺少关键章节：${missingKeywords.join(', ')}`,
      fixItems: [{
        id: 'MISSING_SECTIONS',
        description: `缺少关键章节：${missingKeywords.join(', ')}`,
        suggestion: `请在 DETAIL.md 中添加 ${missingKeywords.join(', ')} 相关章节`
      }]
    };
  }
  
  return { decision: 'pass', notes: '所有检查通过', fixItems: [] };
}

/**
 * Coding 自动审阅
 */
async function reviewCoding(input, projectPath) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  const manifestPath = input.manifestFile || path.join(projectPath, 'PROJECT_MANIFEST.json');
  
  if (!fs.existsSync(manifestPath)) {
    return {
      decision: 'reject',
      notes: 'PROJECT_MANIFEST.json 文件不存在',
      fixItems: [{
        id: 'MANIFEST_MISSING',
        description: 'PROJECT_MANIFEST.json 文件不存在',
        suggestion: '请创建 PROJECT_MANIFEST.json 并定义 test/lint/build 命令'
      }]
    };
  }
  
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return {
      decision: 'reject',
      notes: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
      fixItems: [{
        id: 'MANIFEST_INVALID',
        description: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
        suggestion: '请修复 PROJECT_MANIFEST.json 格式'
      }]
    };
  }
  
  if (!manifest.commands?.test) {
    return {
      decision: 'reject',
      notes: 'PROJECT_MANIFEST.json 缺少 commands.test 字段',
      fixItems: [{
        id: 'TEST_COMMAND_MISSING',
        description: 'PROJECT_MANIFEST.json 缺少 commands.test 字段',
        suggestion: '请在 PROJECT_MANIFEST.json 中添加 commands.test 字段'
      }]
    };
  }
  
  try {
    await execAsync(manifest.commands.test, { cwd: projectPath, timeout: 300000 });
  } catch (error) {
    return {
      decision: 'reject',
      notes: `测试执行失败：${error.message}`,
      fixItems: [{
        id: 'TEST_FAILED',
        description: `测试执行失败：${error.message}`,
        suggestion: '请修复测试失败的问题'
      }]
    };
  }
  
  return { decision: 'pass', notes: '所有检查通过', fixItems: [] };
}

/**
 * Testing 自动审阅
 */
async function reviewTesting(input, projectPath) {
  const verificationPath = path.join(projectPath, '05_testing/VERIFICATION_REPORT.md');
  
  if (!fs.existsSync(verificationPath)) {
    return {
      decision: 'reject',
      notes: 'VERIFICATION_REPORT.md 文件不存在',
      fixItems: [{
        id: 'VERIFICATION_MISSING',
        description: 'VERIFICATION_REPORT.md 文件不存在',
        suggestion: '请执行 testing 阶段生成 VERIFICATION_REPORT.md'
      }]
    };
  }
  
  const testResultsPath = path.join(projectPath, '05_testing/TEST_RESULTS.json');
  const verifyResultsPath = path.join(projectPath, '05_testing/VERIFY_RESULTS.json');
  
  let testPassed = false;
  let verifyPassed = false;
  
  if (fs.existsSync(testResultsPath)) {
    const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
    testPassed = testResults.RESULT === 'PASS';
  }
  
  if (fs.existsSync(verifyResultsPath)) {
    const verifyResults = JSON.parse(fs.readFileSync(verifyResultsPath, 'utf8'));
    verifyPassed = verifyResults.RESULT === 'PASS';
  }
  
  if (!testPassed || !verifyPassed) {
    return {
      decision: 'reject',
      notes: '测试/验收未通过',
      fixItems: [{
        id: 'TEST_OR_VERIFY_FAILED',
        description: `测试：${testPassed ? 'PASS' : 'FAIL'}, 验收：${verifyPassed ? 'PASS' : 'FAIL'}`,
        suggestion: '请修复测试和验收失败的问题'
      }]
    };
  }
  
  return { decision: 'pass', notes: '所有检查通过', fixItems: [] };
}

/**
 * Reviewing 自动审阅
 */
async function reviewReviewing(input, projectPath) {
  const finalReportPath = path.join(projectPath, '05_reviewing/FINAL_REPORT.md');
  const readinessPath = path.join(projectPath, '05_reviewing/RELEASE_READINESS.json');
  
  if (!fs.existsSync(finalReportPath)) {
    return {
      decision: 'reject',
      notes: 'FINAL_REPORT.md 文件不存在',
      fixItems: [{
        id: 'FINAL_REPORT_MISSING',
        description: 'FINAL_REPORT.md 文件不存在',
        suggestion: '请生成 FINAL_REPORT.md'
      }]
    };
  }
  
  if (!fs.existsSync(readinessPath)) {
    return {
      decision: 'reject',
      notes: 'RELEASE_READINESS.json 文件不存在',
      fixItems: [{
        id: 'READINESS_MISSING',
        description: 'RELEASE_READINESS.json 文件不存在',
        suggestion: '请生成 RELEASE_READINESS.json'
      }]
    };
  }
  
  const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));
  
  if (readiness.result !== 'PASS') {
    return {
      decision: 'reject',
      notes: `Release Readiness 检查结果为 ${readiness.result}`,
      fixItems: (readiness.blockingIssues || []).map(issue => ({
        id: `RV_${issue.gateId}`,
        description: issue.description,
        suggestion: issue.suggestion,
        evidencePath: issue.evidencePath
      }))
    };
  }
  
  return { decision: 'pass', notes: '所有检查通过', fixItems: [] };
}

/**
 * Precommit 自动审阅
 */
async function reviewPrecommit(input, projectPath) {
  const reportPath = path.join(projectPath, '07_precommit/PRECOMMIT_REPORT.json');
  
  if (!fs.existsSync(reportPath)) {
    return {
      decision: 'reject',
      notes: 'PRECOMMIT_REPORT.json 文件不存在',
      fixItems: [{
        id: 'PC0_EVIDENCE_MISSING',
        description: 'PRECOMMIT_REPORT.json 文件不存在',
        suggestion: '请执行 precommit 阶段生成完整的证据包',
        evidencePath: '07_precommit/'
      }]
    };
  }
  
  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
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
  
  if (report.result !== 'PASS') {
    const blockingIssues = report.blockingIssues || [];
    return {
      decision: 'reject',
      notes: `Precommit 检查结果为 ${report.result}，禁止提交`,
      fixItems: blockingIssues.map(issue => ({
        id: issue.gateId,
        description: issue.description,
        suggestion: issue.suggestion,
        evidencePath: issue.evidencePath
      }))
    };
  }
  
  return { decision: 'pass', notes: 'Precommit 检查通过，可以安全提交', fixItems: [] };
}

/**
 * Releasing 自动审阅
 */
async function reviewReleasing(input, projectPath) {
  const releasingPath = path.join(projectPath, '06_releasing');
  
  const readinessPath = path.join(projectPath, '05_reviewing/RELEASE_READINESS.json');
  if (!fs.existsSync(readinessPath)) {
    return {
      decision: 'reject',
      notes: '05_reviewing/RELEASE_READINESS.json 文件不存在',
      fixItems: [{
        id: 'RL0_READINESS_MISSING',
        description: 'RELEASE_READINESS.json 文件不存在',
        suggestion: '请先完成 reviewing 阶段并获得 PASS 放行凭证'
      }]
    };
  }
  
  const readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));
  if (readiness.result !== 'PASS') {
    return {
      decision: 'reject',
      notes: `Release Readiness 检查结果为 ${readiness.result}，不允许发布`,
      fixItems: readiness.blockingIssues.map(issue => ({
        id: `RL0_READINESS_${issue.gateId}`,
        description: `Reviewing 阻塞项：${issue.description}`,
        suggestion: issue.suggestion,
        evidencePath: issue.evidencePath
      }))
    };
  }
  
  const requiredFiles = [
    '06_releasing/RELEASE_RECORD.json',
    '06_releasing/RELEASE_NOTES.md',
    '06_releasing/ARTIFACT_MANIFEST.json',
    '06_releasing/CLEANUP_PLAN.json',
    '06_releasing/CLEANUP_REPORT.json'
  ];
  
  const missingFiles = [];
  for (const file of requiredFiles) {
    const filePath = path.join(projectPath, file);
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
        suggestion: '请执行 Releasing 阶段生成完整的发布证据包'
      }]
    };
  }
  
  const cleanupReportPath = path.join(projectPath, '06_releasing/CLEANUP_REPORT.json');
  let cleanupReport;
  try {
    cleanupReport = JSON.parse(fs.readFileSync(cleanupReportPath, 'utf8'));
  } catch (error) {
    return {
      decision: 'reject',
      notes: `CLEANUP_REPORT.json 解析失败：${error.message}`,
      fixItems: [{
        id: 'RL2_CLEANUP_REPORT_INVALID',
        description: `CLEANUP_REPORT.json 解析失败：${error.message}`,
        suggestion: '请修复 CLEANUP_REPORT.json 格式',
        evidencePath: '06_releasing/CLEANUP_REPORT.json'
      }]
    };
  }
  
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
        evidencePath: '06_releasing/CLEANUP_REPORT.json'
      }))
    };
  }
  
  return { decision: 'pass', notes: 'Releasing 检查通过', fixItems: [] };
}

module.exports = {
  executeAutoReview
};
