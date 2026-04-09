/**
 * Coding 自动审阅模块
 * 
 * ClawDevFlow (CDF) 审阅系统
 * 负责 Coding 阶段的自动审阅（Gates C0-C5）
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { runCmd } = require('../../utils/cmd');

/**
 * Coding 自动审阅
 * 
 * Gates:
 * - C0: PROJECT_MANIFEST.json 存在
 * - C1: manifest 可解析且存在 commands.test
 * - C2: 执行 commands.test 必须 PASS
 * - C3: 若存在 commands.lint 必须 PASS
 * - C4: 若存在 commands.build 必须 PASS
 * - C5: 04_coding/CHANGESET.md 存在且包含 test 命令字符串
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.projectPath - 项目路径
 * @param {object} ctx.input - 阶段输入
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function review(ctx) {
  const { projectPath, input } = ctx;
  const manifestPath = input.manifestFile || path.join(projectPath, 'PROJECT_MANIFEST.json');
  
  // Gate C0: PROJECT_MANIFEST.json 存在
  if (!fs.existsSync(manifestPath)) {
    return {
      decision: 'reject',
      notes: 'PROJECT_MANIFEST.json 文件不存在',
      fixItems: [{
        id: 'C0_MANIFEST_MISSING',
        description: 'PROJECT_MANIFEST.json 文件不存在',
        suggestion: '请创建 PROJECT_MANIFEST.json 并定义 test/lint/build 命令',
        evidencePath: 'PROJECT_MANIFEST.json'
      }]
    };
  }
  
  // Gate C1: manifest 可解析且存在 commands.test
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return {
      decision: 'reject',
      notes: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
      fixItems: [{
        id: 'C1_MANIFEST_INVALID',
        description: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
        suggestion: '请修复 PROJECT_MANIFEST.json 格式',
        evidencePath: 'PROJECT_MANIFEST.json'
      }]
    };
  }
  
  if (!manifest.commands?.test) {
    return {
      decision: 'reject',
      notes: 'PROJECT_MANIFEST.json 缺少 commands.test 字段',
      fixItems: [{
        id: 'C1_TEST_COMMAND_MISSING',
        description: 'PROJECT_MANIFEST.json 缺少 commands.test 字段',
        suggestion: '请在 PROJECT_MANIFEST.json 中添加 commands.test 字段',
        evidencePath: 'PROJECT_MANIFEST.json'
      }]
    };
  }
  
  // Gate C2: 执行 commands.test 必须 PASS
  const testResult = await runCmd(manifest.commands.test, {
    cwd: projectPath,
    timeout: 300000
  });
  
  if (testResult.error) {
    return {
      decision: 'reject',
      notes: `测试执行失败：${testResult.error}`,
      fixItems: [{
        id: 'C2_TEST_FAILED',
        description: `测试执行失败：${testResult.error}`,
        suggestion: '请修复测试失败的问题',
        evidencePath: '04_coding/src/'
      }]
    };
  }
  
  // Gate C3: 若存在 commands.lint 必须 PASS
  if (manifest.commands?.lint) {
    const lintResult = await runCmd(manifest.commands.lint, {
      cwd: projectPath,
      timeout: 60000
    });
    
    if (lintResult.error) {
      return {
        decision: 'reject',
        notes: `Lint 执行失败：${lintResult.error}`,
        fixItems: [{
          id: 'C3_LINT_FAILED',
          description: `Lint 执行失败：${lintResult.error}`,
          suggestion: '请修复 lint 错误',
          evidencePath: '04_coding/src/'
        }]
      };
    }
  }
  
  // Gate C4: 若存在 commands.build 必须 PASS
  if (manifest.commands?.build) {
    const buildResult = await runCmd(manifest.commands.build, {
      cwd: projectPath,
      timeout: 120000
    });
    
    if (buildResult.error) {
      return {
        decision: 'reject',
        notes: `构建执行失败：${buildResult.error}`,
        fixItems: [{
          id: 'C4_BUILD_FAILED',
          description: `构建执行失败：${buildResult.error}`,
          suggestion: '请修复构建错误',
          evidencePath: '04_coding/src/'
        }]
      };
    }
  }
  
  // Gate C5: 04_coding/CHANGESET.md 存在且包含 test 命令字符串
  const changesetPath = path.join(projectPath, '04_coding/CHANGESET.md');
  if (!fs.existsSync(changesetPath)) {
    return {
      decision: 'reject',
      notes: 'CHANGESET.md 文件不存在',
      fixItems: [{
        id: 'C5_CHANGESET_MISSING',
        description: 'CHANGESET.md 文件不存在',
        suggestion: '请创建 CHANGESET.md 并记录本次变更',
        evidencePath: '04_coding/CHANGESET.md'
      }]
    };
  }
  
  const changesetContent = fs.readFileSync(changesetPath, 'utf8');
  if (!changesetContent.includes(manifest.commands.test)) {
    return {
      decision: 'reject',
      notes: 'CHANGESET.md 未包含 test 命令',
      fixItems: [{
        id: 'C5_CHANGESET_INVALID',
        description: `CHANGESET.md 未包含 test 命令：${manifest.commands.test}`,
        suggestion: '请在 CHANGESET.md 中添加 test 命令说明',
        evidencePath: '04_coding/CHANGESET.md'
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
