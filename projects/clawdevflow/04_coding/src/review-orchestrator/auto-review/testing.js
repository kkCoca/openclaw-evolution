/**
 * Testing 自动审阅模块
 * 
 * ClawDevFlow (CDF) 审阅系统
 * 负责 Testing 阶段的自动审阅（Gates TG0-TG5）
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { readJson } = require('../../utils/json');

/**
 * Testing 自动审阅
 * 
 * Gates:
 * - TG0: manifest 存在且可解析
 * - TG1: 05_testing/TEST_RESULTS.json 存在
 * - TG2: 05_testing/VERIFY_RESULTS.json 存在
 * - TG3: 05_testing/VERIFICATION_REPORT.md 存在
 * - TG4: 若 VERIFY_RESULTS.ERROR == VERIFY_COMMAND_MISSING => reject
 * - TG5: TEST_RESULTS.RESULT == PASS 且 VERIFY_RESULTS.RESULT == PASS
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.projectPath - 项目路径
 * @param {object} ctx.input - 阶段输入
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function review(ctx) {
  const { projectPath } = ctx;
  const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
  
  // Gate TG0: manifest 存在且可解析
  if (!fs.existsSync(manifestPath)) {
    return {
      decision: 'reject',
      notes: 'PROJECT_MANIFEST.json 文件不存在',
      fixItems: [{
        id: 'TG0_MANIFEST_MISSING',
        description: 'PROJECT_MANIFEST.json 文件不存在',
        suggestion: '请创建 PROJECT_MANIFEST.json',
        evidencePath: 'PROJECT_MANIFEST.json'
      }]
    };
  }
  
  try {
    JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return {
      decision: 'reject',
      notes: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
      fixItems: [{
        id: 'TG0_MANIFEST_INVALID',
        description: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
        suggestion: '请修复 PROJECT_MANIFEST.json 格式',
        evidencePath: 'PROJECT_MANIFEST.json'
      }]
    };
  }
  
  const testingPath = path.join(projectPath, '05_testing');
  
  // Gate TG1: TEST_RESULTS.json 存在
  const testResultsPath = path.join(testingPath, 'TEST_RESULTS.json');
  if (!fs.existsSync(testResultsPath)) {
    return {
      decision: 'reject',
      notes: 'TEST_RESULTS.json 文件不存在',
      fixItems: [{
        id: 'TG1_TEST_RESULTS_MISSING',
        description: 'TEST_RESULTS.json 文件不存在',
        suggestion: '请执行 testing 阶段生成 TEST_RESULTS.json',
        evidencePath: '05_testing/TEST_RESULTS.json'
      }]
    };
  }
  
  // Gate TG2: VERIFY_RESULTS.json 存在
  const verifyResultsPath = path.join(testingPath, 'VERIFY_RESULTS.json');
  if (!fs.existsSync(verifyResultsPath)) {
    return {
      decision: 'reject',
      notes: 'VERIFY_RESULTS.json 文件不存在',
      fixItems: [{
        id: 'TG2_VERIFY_RESULTS_MISSING',
        description: 'VERIFY_RESULTS.json 文件不存在',
        suggestion: '请执行 testing 阶段生成 VERIFY_RESULTS.json',
        evidencePath: '05_testing/VERIFY_RESULTS.json'
      }]
    };
  }
  
  // Gate TG3: VERIFICATION_REPORT.md 存在
  const verificationPath = path.join(testingPath, 'VERIFICATION_REPORT.md');
  if (!fs.existsSync(verificationPath)) {
    return {
      decision: 'reject',
      notes: 'VERIFICATION_REPORT.md 文件不存在',
      fixItems: [{
        id: 'TG3_VERIFICATION_MISSING',
        description: 'VERIFICATION_REPORT.md 文件不存在',
        suggestion: '请执行 testing 阶段生成 VERIFICATION_REPORT.md',
        evidencePath: '05_testing/VERIFICATION_REPORT.md'
      }]
    };
  }
  
  // 读取结果
  const testResults = readJson(testResultsPath);
  const verifyResults = readJson(verifyResultsPath);
  
  // Gate TG4: 若 VERIFY_RESULTS.ERROR == VERIFY_COMMAND_MISSING => reject
  if (verifyResults.ERROR === 'VERIFY_COMMAND_MISSING') {
    return {
      decision: 'reject',
      notes: '缺少 verify 命令',
      fixItems: [{
        id: 'TG4_VERIFY_COMMAND_MISSING',
        description: 'PROJECT_MANIFEST.json 缺少 commands.verify 字段',
        suggestion: '请在 PROJECT_MANIFEST.json 中添加 commands.verify 字段',
        evidencePath: 'PROJECT_MANIFEST.json'
      }]
    };
  }
  
  // Gate TG5: TEST_RESULTS.RESULT == PASS 且 VERIFY_RESULTS.RESULT == PASS
  if (testResults.RESULT !== 'PASS' || verifyResults.RESULT !== 'PASS') {
    return {
      decision: 'reject',
      notes: `测试/验收未通过（测试：${testResults.RESULT}, 验收：${verifyResults.RESULT}）`,
      fixItems: [{
        id: 'TG5_TEST_OR_VERIFY_FAILED',
        description: `测试：${testResults.RESULT}, 验收：${verifyResults.RESULT}`,
        suggestion: '请修复测试和验收失败的问题',
        evidencePath: '05_testing/'
      }]
    };
  }
  
  // 所有 Gates 通过
  return {
    decision: 'pass',
    notes: '所有检查通过',
    fixItems: []
  };
}

module.exports = { review };
