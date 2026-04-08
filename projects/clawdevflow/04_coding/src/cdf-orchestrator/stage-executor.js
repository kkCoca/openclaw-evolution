/**
 * Stage Executor (阶段执行器)
 * 
 * ClawDevFlow (CDF) 核心组件
 * 负责执行单个研发阶段（designing/roadmapping/detailing/coding/reviewing）
 * 
 * @version 3.0.1
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { validateRoadmappingEntry } = require('../utils/validate-roadmapping-entry');

// 引入 AI 工具适配器
const { OpenCodeAdapter } = require('../adapters/opencode');

const execAsync = promisify(exec);

/**
 * 阶段枚举
 */
const Stage = {
  DESIGNING: 'designing',
  ROADMAPPING: 'roadmapping',
  DETAILING: 'detailing',
  CODING: 'coding',
  TESTING: 'testing',
  REVIEWING: 'reviewing'
};

/**
 * 阶段执行器
 */
class StageExecutor {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   * @param {object} stateManager - 状态管理器（用于 Gate 校验）
   */
  constructor(config, stateManager) {
    this.config = config || {};
    this.workspaceRoot = config.workspaceRoot || '/home/ouyp/Learning/Practice/openclaw-universe';
    this.stateManager = stateManager;  // P0#2 修复：传入 stateManager 用于 Gate 校验
    
    // 初始化 AI 工具适配器
    this.aiAdapter = new OpenCodeAdapter({
      workspaceRoot: this.workspaceRoot,
      timeoutSeconds: config.timeoutSeconds || 1800
    });
    
    console.log('[Stage-Executor] 阶段执行器初始化完成');
    console.log(`[Stage-Executor]   工作区根目录：${this.workspaceRoot}`);
    console.log(`[Stage-Executor]   AI 工具：opencode`);
  }

  /**
   * 执行阶段
   * 
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @param {string} projectPath - 项目路径
   * @returns {Promise<{success: boolean, outputs: string[], error?: string}>}
   */
  async execute(stageName, input, projectPath) {
    console.log('');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log(`[Stage-Executor] 开始执行阶段：${stageName.toUpperCase()}`);
    console.log(`[Stage-Executor] 项目路径：${projectPath}`);
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('');

    try {
      switch (stageName) {
        case Stage.DESIGNING:
          return await this.executeDesigning(input, projectPath);
        
        case Stage.ROADMAPPING:
          return await this.executeRoadmapping(input, projectPath);
        
        case Stage.DETAILING:
          return await this.executeDetailing(input, projectPath);
        
        case Stage.CODING:
          return await this.executeCoding(input, projectPath);
        
        case Stage.TESTING:
          return await this.executeTesting(input, projectPath);
        
        case Stage.REVIEWING:
          return await this.executeReviewing(input, projectPath);
        
        default:
          throw new Error(`未知阶段：${stageName}`);
      }
    } catch (error) {
      console.error(`[Stage-Executor] ❌ 阶段执行失败:`, error.message);
      return {
        success: false,
        outputs: [],
        error: error.message
      };
    }
  }

  /**
   * 执行 Designing 阶段
   */
  async executeDesigning(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：DESIGNING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const designingPath = path.join(projectPath, '01_designing');
    
    // 确保目录存在
    if (!fs.existsSync(designingPath)) {
      fs.mkdirSync(designingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${designingPath}`);
    }

    // 调用 AI 工具适配器执行 Designing 阶段
    console.log('[Stage-Executor] 调用 AI 工具执行 Designing 阶段...');
    
    const result = await this.aiAdapter.execute('designing', {
      projectPath: projectPath,
      requirementsFile: input.requirementsFile,
      outputDir: designingPath
    });
    
    if (!result.success) {
      throw new Error(`Designing 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Designing 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    console.log(`[Stage-Executor]   文件：${result.outputs.join(', ')}`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Roadmapping 阶段
   */
  async executeRoadmapping(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：ROADMAPPING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    // P0#2 修复：Gate#2 防绕过校验（执行层）
    if (this.stateManager) {
      const validation = validateRoadmappingEntry(this.stateManager, this.stateManager.state);
      if (!validation.ok) {
        throw new Error(`roadmapping 入口门禁失败（Gate#2）: ${validation.reason}`);
      }
      console.log('[Stage-Executor] ✅ roadmapping 入口门禁校验通过（Gate#2）');
    }
    
    const roadmappingPath = path.join(projectPath, '02_roadmapping');
    const designingPath = path.join(projectPath, '01_designing');
    
    if (!fs.existsSync(roadmappingPath)) {
      fs.mkdirSync(roadmappingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${roadmappingPath}`);
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Roadmapping 阶段...');
    
    // 传递 attempt + regenerateHint（自动返工闭环）
    const result = await this.aiAdapter.execute('roadmapping', {
      projectPath: projectPath,
      designingPath: designingPath,
      outputDir: roadmappingPath,
      attempt: input.attempt || 1,
      regenerateHint: input.regenerateHint || ''
    });
    
    if (!result.success) {
      throw new Error(`Roadmapping 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Roadmapping 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Detailing 阶段
   */
  async executeDetailing(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：DETAILING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const detailingPath = path.join(projectPath, '03_detailing');
    
    if (!fs.existsSync(detailingPath)) {
      fs.mkdirSync(detailingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${detailingPath}`);
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Detailing 阶段...');
    
    // 传递 attempt + regenerateHint（自动返工闭环）
    const result = await this.aiAdapter.execute('detailing', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      roadmappingPath: path.join(projectPath, '02_roadmapping'),
      outputDir: detailingPath,
      attempt: input.attempt || 1,
      regenerateHint: input.regenerateHint || ''
    });
    
    if (!result.success) {
      throw new Error(`Detailing 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Detailing 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Coding 阶段
   */
  async executeCoding(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：CODING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const codingPath = path.join(projectPath, '04_coding');
    const srcPath = path.join(codingPath, 'src');
    
    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${srcPath}`);
    }

    // Gate 防绕过：校验 manifest 存在 + commands.test 存在
    const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (!manifest.commands || !manifest.commands.test) {
          throw new Error('PROJECT_MANIFEST.json 缺少 commands.test 字段');
        }
        console.log('[Stage-Executor] ✅ PROJECT_MANIFEST.json 校验通过');
      } catch (error) {
        throw new Error(`PROJECT_MANIFEST.json 校验失败：${error.message}`);
      }
    } else {
      console.log('[Stage-Executor] ⚠️ PROJECT_MANIFEST.json 不存在，将在审阅阶段 reject');
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Coding 阶段...');
    
    // 传递 attempt + regenerateHint（自动返工闭环）
    const result = await this.aiAdapter.execute('coding', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      detailingPath: path.join(projectPath, '03_detailing'),
      outputDir: srcPath,
      attempt: input.attempt || 1,
      regenerateHint: input.regenerateHint || ''
    });
    
    if (!result.success) {
      throw new Error(`Coding 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Coding 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    // 确保 CHANGESET.md 一定存在（不依赖 AI）
    const changesetPath = path.join(codingPath, 'CHANGESET.md');
    if (!fs.existsSync(changesetPath)) {
      console.log('[Stage-Executor] 创建 CHANGESET.md 模板...');
      
      // GAP-1 修复：读取 manifest 的 commands.test，确保 CHANGESET 包含真实命令
      let testCmd = 'npm test';  // 默认占位
      try {
        const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (manifest.commands && manifest.commands.test) {
            testCmd = manifest.commands.test;
          }
        }
      } catch (error) {
        console.log('[Stage-Executor] ⚠️ 无法读取 manifest，使用默认 test 命令');
      }
      
      const changesetContent = `# 变更说明 - Coding 阶段

## 本次变更
- 时间：${new Date().toISOString()}
- 尝试次数：${input.attempt || 1}

## 如何跑命令
请根据 PROJECT_MANIFEST.json 执行以下命令：

\`\`\`bash
# 测试
${testCmd}

# Lint（如有）
${input.manifestFile ? '见 PROJECT_MANIFEST.json' : 'npm run lint'}

# 构建（如有）
${input.manifestFile ? '见 PROJECT_MANIFEST.json' : 'npm run build'}
\`\`\`

## 变更详情
待补充...
`;
      fs.writeFileSync(changesetPath, changesetContent, 'utf8');
      console.log(`[Stage-Executor] ✅ CHANGESET.md 模板已创建（testCmd: ${testCmd}）`);
    }
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Testing 阶段（T0-T5：产出证据包）
   */
  async executeTesting(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：TESTING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const testingPath = path.join(projectPath, '05_testing');
    
    // 确保目录存在
    if (!fs.existsSync(testingPath)) {
      fs.mkdirSync(testingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${testingPath}`);
    }

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
        timeout: 300000  // 5 分钟超时
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
        const installResult = await execAsync(manifest.commands.install, {
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
        try {
          const lintResult = await execAsync(manifest.commands.lint, {
            cwd: projectPath,
            timeout: testContext.timeout
          });
          fs.writeFileSync(
            path.join(testingPath, 'LINT.log'),
            lintResult.stdout + lintResult.stderr,
            'utf8'
          );
          console.log('[Stage-Executor] ✅ T2: LINT.log 已写入');
        } catch (error) {
          fs.writeFileSync(
            path.join(testingPath, 'LINT.log'),
            `LINT 失败：${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`,
            'utf8'
          );
          console.log('[Stage-Executor] ⚠️ T2: LINT 失败，日志已写入');
        }
      }

      // T3: Build（可选）
      if (manifest.commands?.build) {
        console.log(`[Stage-Executor] T3: Build - 执行 ${manifest.commands.build}`);
        try {
          const buildResult = await execAsync(manifest.commands.build, {
            cwd: projectPath,
            timeout: testContext.timeout
          });
          fs.writeFileSync(
            path.join(testingPath, 'BUILD.log'),
            buildResult.stdout + buildResult.stderr,
            'utf8'
          );
          console.log('[Stage-Executor] ✅ T3: BUILD.log 已写入');
        } catch (error) {
          fs.writeFileSync(
            path.join(testingPath, 'BUILD.log'),
            `BUILD 失败：${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`,
            'utf8'
          );
          console.log('[Stage-Executor] ⚠️ T3: BUILD 失败，日志已写入');
        }
      }

      // T4: Test（必需）
      console.log('[Stage-Executor] T4: Test - 执行测试...');
      const testCmd = manifest.commands?.test || 'npm test';
      let testPassed = false;
      let testError = null;
      let testOutput = '';
      
      try {
        const testResult = await execAsync(testCmd, {
          cwd: projectPath,
          timeout: testContext.timeout
        });
        testOutput = testResult.stdout + testResult.stderr;
        testPassed = true;
        console.log('[Stage-Executor] ✅ T4: 测试通过');
      } catch (error) {
        testOutput = `测试失败：${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`;
        testError = error.message;
        console.log('[Stage-Executor] ❌ T4: 测试失败');
      }
      
      fs.writeFileSync(
        path.join(testingPath, 'TEST.log'),
        testOutput,
        'utf8'
      );
      
      // 写入 TEST_RESULTS.json（结构化）
      const testResults = {
        TEST_CMD: testCmd,
        RESULT: testPassed ? 'PASS' : 'FAIL',
        DURATION: 0,  // 简化实现
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
      
      // P0-2 修复：缺 verify 命令时不静默放行，直接标记 FAIL
      if (!verifyCmd) {
        verifyError = 'VERIFY_COMMAND_MISSING';
        verifyOutput = '验收失败：PROJECT_MANIFEST.json 缺少 commands.verify 字段';
        console.log('[Stage-Executor] ❌ T5: 缺少 verify 命令，标记为 FAIL');
      } else {
        try {
          const verifyResult = await execAsync(verifyCmd, {
            cwd: projectPath,
            timeout: testContext.timeout
          });
          verifyOutput = verifyResult.stdout + verifyResult.stderr;
          verifyPassed = true;
          console.log('[Stage-Executor] ✅ T5: 验收通过');
        } catch (error) {
          verifyOutput = `验收失败：${error.message}\n${error.stdout || ''}\n${error.stderr || ''}`;
          verifyError = error.message;
          console.log('[Stage-Executor] ❌ T5: 验收失败');
        }
      }
      
      fs.writeFileSync(
        path.join(testingPath, 'VERIFY.log'),
        verifyOutput,
        'utf8'
      );
      
      // 写入 VERIFY_RESULTS.json（结构化）
      const verifyResults = {
        VERIFY_CMD: verifyCmd || 'MISSING',
        RESULT: verifyPassed ? 'PASS' : 'FAIL',
        DURATION: 0,  // 简化实现
        ERROR: verifyError
      };
      fs.writeFileSync(
        path.join(testingPath, 'VERIFY_RESULTS.json'),
        JSON.stringify(verifyResults, null, 2),
        'utf8'
      );
      
      // 写入 VERIFICATION_REPORT.md（最终签字报告）
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
      console.log('[Stage-Executor] ✅ T5: VERIFY.log + VERIFY_RESULTS.json + VERIFICATION_REPORT.md 已写入');

      // 返回成功（命令失败也尽量返回 success=true，由审阅阶段决定 reject）
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
      // 系统级错误（如写盘失败）才返回 success=false
      return {
        success: false,
        outputs: [],
        error: error.message
      };
    }
  }

  /**
   * 执行 Reviewing 阶段（兜底生成 FINAL_REPORT.md 模板）
   */
  async executeReviewing(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：REVIEWING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const reviewingPath = path.join(projectPath, '05_reviewing');
    
    // 确保目录存在
    if (!fs.existsSync(reviewingPath)) {
      fs.mkdirSync(reviewingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${reviewingPath}`);
    }

    try {
      // 兜底：若 FINAL_REPORT.md 不存在，生成非空模板
      const finalReportPath = path.join(reviewingPath, 'FINAL_REPORT.md');
      if (!fs.existsSync(finalReportPath)) {
        console.log('[Stage-Executor] 兜底生成 FINAL_REPORT.md 模板...');
        const finalReportContent = `# 项目收口报告 - Reviewing 阶段

## 执行信息
- 时间：${new Date().toISOString()}
- 项目路径：${projectPath}

## 收口结论
待 AI 或人工填充...

## 证据引用
- Testing 验收报告：05_testing/VERIFICATION_REPORT.md
- 变更说明：04_coding/CHANGESET.md
- 项目 Manifest: PROJECT_MANIFEST.json

## 发布就绪
详见：05_reviewing/RELEASE_READINESS.json
`;
        fs.writeFileSync(finalReportPath, finalReportContent, 'utf8');
        console.log('[Stage-Executor] ✅ FINAL_REPORT.md 模板已生成');
      }

      // 调用 AI 工具执行 Reviewing 阶段（可选，若配置了 AI 工具）
      console.log('[Stage-Executor] 调用 AI 工具执行 Reviewing 阶段...');
      
      // P0 修复：统一 reviewing AI 调用入参（与历史版本一致）
      const result = await this.aiAdapter.execute('reviewing', {
        projectPath: projectPath,
        designingPath: path.join(projectPath, '01_designing'),
        codingPath: path.join(projectPath, '04_coding'),
        outputDir: reviewingPath
      });
      
      if (!result.success) {
        throw new Error(`Reviewing 阶段执行失败：${result.error}`);
      }
      
      console.log('[Stage-Executor] ✅ Reviewing 阶段完成');
      console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
      
      return {
        success: true,
        outputs: result.outputs.map(o => ({
          name: path.basename(o),
          path: path.relative(projectPath, o)
        }))
      };

    } catch (error) {
      console.error('[Stage-Executor] ❌ Reviewing 阶段执行失败:', error.message);
      return {
        success: false,
        outputs: [],
        error: error.message
      };
    }
  }
}

module.exports = StageExecutor;
module.exports.Stage = Stage;
