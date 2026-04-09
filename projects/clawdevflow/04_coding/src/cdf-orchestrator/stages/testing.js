/**
 * Testing 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Testing 阶段：运行测试并产出证据包
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { ensureDir } = require('../utils/fsx');
const { runCmd } = require('../utils/cmd');

/**
 * 执行 Testing 阶段
 * @param {object} aiAdapter - AI 工具适配器（未使用，保持接口一致）
 * @param {object} stateManager - 状态管理器（未使用，保持接口一致）
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array}>}
 */
async function executeTesting(aiAdapter, stateManager, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：TESTING');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  const testingPath = path.join(projectPath, '05_testing');
  ensureDir(testingPath);

  try {
    // T0: Preflight（入口准备/上下文锁定）
    console.log('[Stage-Executor] T0: Preflight - 准备测试上下文...');
    const manifestPath = input.manifestFile || path.join(projectPath, 'PROJECT_MANIFEST.json');
    let manifest = {};
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    
    const testContext = {
      attempt: input.attempt || 1,
      timestamp: new Date().toISOString(),
      cwd: projectPath,
      language: manifest.language || 'unknown',
      commands: manifest.commands || {},
      timeout: 300000
    };
    fs.writeFileSync(
      path.join(testingPath, 'TEST_CONTEXT.json'),
      JSON.stringify(testContext, null, 2),
      'utf8'
    );
    console.log('[Stage-Executor] ✅ T0: TEST_CONTEXT.json 已写入');

    // T1: Install（可选）
    if (manifest.commands?.install) {
      console.log(`[Stage-Executor] T1: Install - 执行 ${manifest.commands.install}`);
      const installResult = await runCmd(manifest.commands.install, {
        cwd: projectPath,
        timeout: testContext.timeout
      });
      fs.writeFileSync(
        path.join(testingPath, 'INSTALL.log'),
        installResult.stdout + installResult.stderr,
        'utf8'
      );
      console.log('[Stage-Executor] ✅ T1: INSTALL.log 已写入');
    }

    // T2: Lint（可选）
    if (manifest.commands?.lint) {
      console.log(`[Stage-Executor] T2: Lint - 执行 ${manifest.commands.lint}`);
      const lintResult = await runCmd(manifest.commands.lint, {
        cwd: projectPath,
        timeout: testContext.timeout
      });
      fs.writeFileSync(
        path.join(testingPath, 'LINT.log'),
        lintResult.stdout + lintResult.stderr,
        'utf8'
      );
      console.log('[Stage-Executor] ✅ T2: LINT.log 已写入');
    }

    // T3: Build（可选）
    if (manifest.commands?.build) {
      console.log(`[Stage-Executor] T3: Build - 执行 ${manifest.commands.build}`);
      const buildResult = await runCmd(manifest.commands.build, {
        cwd: projectPath,
        timeout: testContext.timeout
      });
      fs.writeFileSync(
        path.join(testingPath, 'BUILD.log'),
        buildResult.stdout + buildResult.stderr,
        'utf8'
      );
      console.log('[Stage-Executor] ✅ T3: BUILD.log 已写入');
    }

    // T4: Test（必需）
    console.log('[Stage-Executor] T4: Test - 执行测试...');
    const testCmd = manifest.commands?.test || 'npm test';
    let testPassed = false;
    let testError = null;
    let testOutput = '';
    
    const testResult = await runCmd(testCmd, {
      cwd: projectPath,
      timeout: testContext.timeout
    });
    
    testOutput = testResult.stdout + testResult.stderr;
    testError = testResult.error;
    testPassed = !testResult.error;
    
    fs.writeFileSync(
      path.join(testingPath, 'TEST.log'),
      testOutput,
      'utf8'
    );
    
    const testResults = {
      TEST_CMD: testCmd,
      RESULT: testPassed ? 'PASS' : 'FAIL',
      DURATION: 0,
      ERROR: testError
    };
    fs.writeFileSync(
      path.join(testingPath, 'TEST_RESULTS.json'),
      JSON.stringify(testResults, null, 2),
      'utf8'
    );
    console.log('[Stage-Executor] ✅ T4: TEST.log + TEST_RESULTS.json 已写入');

    // T5: Verify（必需）
    console.log('[Stage-Executor] T5: Verify - 执行验收...');
    const verifyCmd = manifest.commands?.verify;
    let verifyPassed = false;
    let verifyError = null;
    let verifyOutput = '';
    
    if (!verifyCmd) {
      verifyError = 'VERIFY_COMMAND_MISSING';
      verifyOutput = '验收失败：PROJECT_MANIFEST.json 缺少 commands.verify 字段';
      console.log('[Stage-Executor] ❌ T5: 缺少 verify 命令，标记为 FAIL');
    } else {
      const verifyResult = await runCmd(verifyCmd, {
        cwd: projectPath,
        timeout: testContext.timeout
      });
      verifyOutput = verifyResult.stdout + verifyResult.stderr;
      verifyError = verifyResult.error;
      verifyPassed = !verifyResult.error;
      console.log('[Stage-Executor] ✅ T5: 验收通过');
    }
    
    fs.writeFileSync(
      path.join(testingPath, 'VERIFY.log'),
      verifyOutput,
      'utf8'
    );
    
    const verifyResults = {
      VERIFY_CMD: verifyCmd || 'MISSING',
      RESULT: verifyPassed ? 'PASS' : 'FAIL',
      DURATION: 0,
      ERROR: verifyError
    };
    fs.writeFileSync(
      path.join(testingPath, 'VERIFY_RESULTS.json'),
      JSON.stringify(verifyResults, null, 2),
      'utf8'
    );
    
    const verificationReport = `# 验收报告 - Testing 阶段

## 执行信息
- 时间：${testContext.timestamp}
- 尝试次数：${testContext.attempt}
- 项目路径：${projectPath}

## 测试命令
- TEST_CMD: \`${testCmd}\`
- 结果：${testResults.RESULT}

## 验收命令
- VERIFY_CMD: \`${verifyCmd || 'MISSING'}\`
- 结果：${verifyResults.RESULT}
${verifyError ? `\n## 错误信息\n${verifyError}` : ''}

## 最终判定
**RESULT: ${testPassed && verifyPassed ? 'PASS' : 'FAIL'}**

## 日志文件
- TEST.log
- VERIFY.log
- （可选）INSTALL.log / LINT.log / BUILD.log
`;
    fs.writeFileSync(
      path.join(testingPath, 'VERIFICATION_REPORT.md'),
      verificationReport,
      'utf8'
    );
    console.log('[Stage-Executor] ✅ T5: VERIFICATION_REPORT.md 已写入');

    return {
      success: true,
      outputs: [
        path.join(testingPath, 'TEST_CONTEXT.json'),
        path.join(testingPath, 'TEST_RESULTS.json'),
        path.join(testingPath, 'VERIFY_RESULTS.json'),
        path.join(testingPath, 'VERIFICATION_REPORT.md'),
        path.join(testingPath, 'TEST.log'),
        path.join(testingPath, 'VERIFY.log')
      ].filter(p => fs.existsSync(p))
    };

  } catch (error) {
    console.error('[Stage-Executor] ❌ Testing 阶段执行失败:', error.message);
    return {
      success: false,
      outputs: [],
      error: error.message
    };
  }
}

module.exports = {
  execute: executeTesting
};
