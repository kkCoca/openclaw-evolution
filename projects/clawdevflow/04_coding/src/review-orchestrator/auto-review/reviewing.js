/**
 * Reviewing 自动审阅模块
 * 
 * ClawDevFlow (CDF) 审阅系统
 * 负责 Reviewing 阶段的自动审阅（Gates RG0-RG6）+ 生成 RELEASE_READINESS.json
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { readJson } = require('../../utils/json');
const { existsNonEmpty } = require('../../utils/fsx');

/**
 * Reviewing 自动审阅
 * 
 * Gates:
 * - RG0: 确保 05_reviewing/ 目录存在
 * - RG1: 05_reviewing/FINAL_REPORT.md 存在且非空
 * - RG2: testing evidence pack（三件套）存在
 * - RG3: testing 结果 PASS
 * - RG4: manifest 存在且包含 commands.test 与 commands.verify
 * - RG5: 04_coding/CHANGESET.md 存在且非空
 * - RG6: 无论 PASS/FAIL 都必须生成 RELEASE_READINESS.json
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.projectPath - 项目路径
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function review(ctx) {
  const { projectPath } = ctx;
  const reviewingPath = path.join(projectPath, '05_reviewing');
  const testingPath = path.join(projectPath, '06_testing');
  const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
  const changesetPath = path.join(projectPath, '04_coding/CHANGESET.md');
  
  const blockingIssues = [];
  
  // Gate RG0: 确保 05_reviewing/ 目录存在
  if (!fs.existsSync(reviewingPath)) {
    fs.mkdirSync(reviewingPath, { recursive: true });
  }
  
  // Gate RG1: FINAL_REPORT.md 存在且非空
  const finalReportPath = path.join(reviewingPath, 'FINAL_REPORT.md');
  if (!existsNonEmpty(finalReportPath)) {
    blockingIssues.push({
      gateId: 'RG1',
      description: 'FINAL_REPORT.md 文件不存在或为空',
      suggestion: '请生成 FINAL_REPORT.md',
      evidencePath: '05_reviewing/FINAL_REPORT.md'
    });
  }
  
  // Gate RG2: testing evidence pack（三件套）存在
  const testResultsPath = path.join(testingPath, 'TEST_RESULTS.json');
  const verifyResultsPath = path.join(testingPath, 'VERIFY_RESULTS.json');
  const verificationPath = path.join(testingPath, 'VERIFICATION_REPORT.md');
  
  if (!fs.existsSync(testResultsPath)) {
    blockingIssues.push({
      gateId: 'RG2',
      description: 'TEST_RESULTS.json 文件不存在',
      suggestion: '请执行 testing 阶段生成 TEST_RESULTS.json',
      evidencePath: '06_testing/TEST_RESULTS.json'
    });
  }
  
  if (!fs.existsSync(verifyResultsPath)) {
    blockingIssues.push({
      gateId: 'RG2',
      description: 'VERIFY_RESULTS.json 文件不存在',
      suggestion: '请执行 testing 阶段生成 VERIFY_RESULTS.json',
      evidencePath: '06_testing/VERIFY_RESULTS.json'
    });
  }
  
  if (!fs.existsSync(verificationPath)) {
    blockingIssues.push({
      gateId: 'RG2',
      description: 'VERIFICATION_REPORT.md 文件不存在',
      suggestion: '请执行 testing 阶段生成 VERIFICATION_REPORT.md',
      evidencePath: '06_testing/VERIFICATION_REPORT.md'
    });
  }
  
  // Gate RG3: testing 结果 PASS
  let testingPassed = true;
  if (fs.existsSync(testResultsPath) && fs.existsSync(verifyResultsPath)) {
    const testResults = readJson(testResultsPath);
    const verifyResults = readJson(verifyResultsPath);
    const testResultValue = readResultValue(testResults);
    const verifyResultValue = readResultValue(verifyResults);
    
    if (testResultValue !== 'PASS' || verifyResultValue !== 'PASS') {
      testingPassed = false;
      blockingIssues.push({
        gateId: 'RG3',
        description: `测试/验收未通过（测试：${testResultValue}, 验收：${verifyResultValue}）`,
        suggestion: '请修复测试和验收失败的问题',
        evidencePath: '06_testing/'
      });
    }
  }
  
  // Gate RG4: manifest 存在且包含 commands.test 与 commands.verify
  if (!fs.existsSync(manifestPath)) {
    blockingIssues.push({
      gateId: 'RG4',
      description: 'PROJECT_MANIFEST.json 文件不存在',
      suggestion: '请创建 PROJECT_MANIFEST.json',
      evidencePath: 'PROJECT_MANIFEST.json'
    });
  } else {
    try {
      const manifest = readJson(manifestPath);
      if (!manifest.commands?.test) {
        blockingIssues.push({
          gateId: 'RG4',
          description: 'PROJECT_MANIFEST.json 缺少 commands.test 字段',
          suggestion: '请添加 commands.test 字段',
          evidencePath: 'PROJECT_MANIFEST.json'
        });
      }
      if (!manifest.commands?.verify) {
        blockingIssues.push({
          gateId: 'RG4',
          description: 'PROJECT_MANIFEST.json 缺少 commands.verify 字段',
          suggestion: '请添加 commands.verify 字段',
          evidencePath: 'PROJECT_MANIFEST.json'
        });
      }
    } catch (error) {
      blockingIssues.push({
        gateId: 'RG4',
        description: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
        suggestion: '请修复 PROJECT_MANIFEST.json 格式',
        evidencePath: 'PROJECT_MANIFEST.json'
      });
    }
  }
  
  // Gate RG5: CHANGESET.md 存在且非空
  if (!existsNonEmpty(changesetPath)) {
    blockingIssues.push({
      gateId: 'RG5',
      description: 'CHANGESET.md 文件不存在或为空',
      suggestion: '请创建 CHANGESET.md 并记录本次变更',
      evidencePath: '04_coding/CHANGESET.md'
    });
  }
  
  // Gate RG6: 生成 RELEASE_READINESS.json（无论 PASS/FAIL）
  const readiness = buildReadiness(blockingIssues);
  
  // 返回决策
  if (blockingIssues.length > 0) {
    return {
      decision: 'reject',
      notes: `Reviewing 检查失败：${blockingIssues.length} 个 blocking issue`,
      fixItems: blockingIssues.map(issue => ({
        id: issue.gateId,
        description: issue.description,
        suggestion: issue.suggestion,
        evidencePath: issue.evidencePath
      })),
      readiness
    };
  }
  
  return {
    decision: 'pass',
    notes: '所有检查通过',
    fixItems: [],
    readiness
  };
}

/**
 * 构建 Release Readiness 结果
 * @param {Array} blockingIssues - 阻塞项
 * @returns {object} readiness 结果
 */
function buildReadiness(blockingIssues) {
  return {
    schemaVersion: 'v1',
    generatedAt: new Date().toISOString(),
    result: blockingIssues.length === 0 ? 'PASS' : 'FAIL',
    evidence: {
      finalReport: '05_reviewing/FINAL_REPORT.md',
      testResults: '06_testing/TEST_RESULTS.json',
      verifyResults: '06_testing/VERIFY_RESULTS.json',
      verificationReport: '06_testing/VERIFICATION_REPORT.md',
      changeset: '04_coding/CHANGESET.md'
    },
    blockingIssues: blockingIssues
  };
}

function readResultValue(resultJson) {
  if (!resultJson || typeof resultJson !== 'object') {
    return undefined;
  }
  return resultJson.RESULT ?? resultJson.result;
}

module.exports = { review };
