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
  REVIEWING: 'reviewing',
  PRECOMMIT: 'precommit',
  RELEASING: 'releasing'
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
        
        case Stage.PRECOMMIT:
          return await this.executePrecommit(input, projectPath);
        
        case Stage.RELEASING:
          return await this.executeReleasing(input, projectPath);
        
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

  /**
   * 执行 Precommit 阶段（提交前清理 + 提交风险检查）
   * 
   * Gate 定义：
   * - PC0：禁止存在未忽略的敏感文件（.env, *.pem, *.key, id_rsa, *.p12）
   * - PC1：禁止存在未跟踪文件（git status ??）且不在允许白名单
   * - PC2：禁止 releasing 证据包目录 06_releasing/ 被纳入提交风险
   */
  async executePrecommit(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：PRECOMMIT');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const precommitPath = path.join(projectPath, '07_precommit');
    
    // 确保目录存在
    if (!fs.existsSync(precommitPath)) {
      fs.mkdirSync(precommitPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${precommitPath}`);
    }

    try {
      // Step A: 生成 PRECOMMIT_PLAN.json
      console.log('[Stage-Executor] 生成 PRECOMMIT_PLAN.json...');
      const precommitPlan = {
        version: 'v1',
        generatedAt: new Date().toISOString(),
        cleanupTargets: [
          { pattern: '.DS_Store', reason: '系统临时文件' },
          { pattern: 'Thumbs.db', reason: '系统临时文件' },
          { pattern: '*.tmp', reason: '临时文件' },
          { pattern: '*.swp', reason: '编辑器交换文件' },
          { pattern: '*~', reason: '备份文件' },
          { pattern: '__pycache__/', reason: 'Python 缓存' },
          { pattern: '*.pyc', reason: 'Python 编译文件' },
          { pattern: 'node_modules/', reason: '依赖目录（应通过 .gitignore 忽略）' },
          { pattern: 'dist/', reason: '构建输出（应通过 .gitignore 忽略）' },
          { pattern: 'build/', reason: '构建输出（应通过 .gitignore 忽略）' }
        ],
        securityPatterns: [
          '.env',
          '*.pem',
          '*.key',
          'id_rsa',
          '*.p12',
          '*.pfx',
          '*.crt',
          '*.cer'
        ],
        gitCheck: {
          enabled: true,
          allowlist: [
            'README.md',
            'CHANGELOG.md',
            'LICENSE',
            '.gitignore',
            'package.json',
            'package-lock.json'
          ]
        },
        protectedDirectories: [
          '06_releasing/',
          '07_precommit/'
        ]
      };
      fs.writeFileSync(
        path.join(precommitPath, 'PRECOMMIT_PLAN.json'),
        JSON.stringify(precommitPlan, null, 2),
        'utf8'
      );
      console.log('[Stage-Executor] ✅ PRECOMMIT_PLAN.json 已生成');

      // Step B: 执行清理和风险检查
      console.log('[Stage-Executor] 执行提交前清理和风险检查...');
      const precommitReport = {
        version: 'v1',
        executedAt: new Date().toISOString(),
        deleted: [],
        securityFindings: [],
        gitStatus: '',
        untrackedFiles: [],
        result: 'PASS',
        blockingIssues: []
      };

      // B1: 扫描敏感文件（PC0）
      console.log('[Stage-Executor] PC0: 扫描敏感文件...');
      try {
        const rootItems = fs.readdirSync(projectPath);
        for (const item of rootItems) {
          const itemPath = path.join(projectPath, item);
          const stat = fs.statSync(itemPath);
          
          // 跳过受保护的目录
          if (stat.isDirectory() && precommitPlan.protectedDirectories.some(d => itemPath.includes(d))) {
            continue;
          }
          
          // 检查敏感文件
          for (const pattern of precommitPlan.securityPatterns) {
            if ((pattern.startsWith('*') && item.endsWith(pattern.slice(1))) || 
                (pattern === item)) {
              precommitReport.securityFindings.push({
                path: item,
                pattern: pattern,
                severity: 'HIGH',
                gateId: 'PC0',
                recommendation: `敏感文件，禁止提交：${item}`
              });
              console.log(`[Stage-Executor] ❌ PC0: 发现敏感文件：${item} (${pattern})`);
              break;
            }
          }
        }
      } catch (error) {
        console.error('[Stage-Executor] ⚠️ 敏感文件扫描失败:', error.message);
      }

      // B2: 检查 git status（PC1）
      console.log('[Stage-Executor] PC1: 检查 git 未跟踪文件...');
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const gitStatusResult = await execAsync('git status --porcelain', {
          cwd: projectPath,
          timeout: 30000
        });
        
        precommitReport.gitStatus = gitStatusResult.stdout.trim();
        
        // 解析未跟踪文件（?? 开头）
        const lines = precommitReport.gitStatus.split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (line.startsWith('??')) {
            const file = line.slice(3).trim();
            const fileName = path.basename(file);
            
            // 检查是否在 allowlist 中
            const inAllowlist = precommitPlan.gitCheck.allowlist.some(
              allowed => file === allowed || fileName === allowed
            );
            
            // 检查是否是受保护目录
            const isProtectedDir = precommitPlan.protectedDirectories.some(
              dir => file.startsWith(dir)
            );
            
            if (!inAllowlist) {
              precommitReport.untrackedFiles.push({
                path: file,
                gateId: 'PC1',
                isProtectedDir: isProtectedDir,
                recommendation: isProtectedDir 
                  ? `受保护目录内容，不应提交：${file}`
                  : `未跟踪文件，请确认是否应该提交：${file}`
              });
              console.log(`[Stage-Executor] ❌ PC1: 发现未跟踪文件：${file}`);
            }
          }
        }
      } catch (error) {
        // git 命令失败，可能是非 git 仓库
        precommitReport.gitStatus = `ERROR: ${error.message}`;
        precommitReport.blockingIssues.push({
          gateId: 'PC1',
          description: '无法执行 git status 命令，请确认当前目录是 git 仓库',
          evidencePath: '07_precommit/PRECOMMIT_REPORT.json',
          suggestion: '请在 git 仓库内运行 precommit 阶段，或初始化 git 仓库'
        });
        console.error('[Stage-Executor] ❌ PC1: git status 执行失败:', error.message);
      }

      // B3: 检查 releasing 目录是否被纳入提交风险（PC2）
      console.log('[Stage-Executor] PC2: 检查 releasing 证据包提交风险...');
      const releasingDir = path.join(projectPath, '06_releasing');
      if (fs.existsSync(releasingDir)) {
        try {
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          
          const gitLsFilesResult = await execAsync('git ls-files 06_releasing/', {
            cwd: projectPath,
            timeout: 30000
          });
          
          if (gitLsFilesResult.stdout.trim()) {
            const trackedFiles = gitLsFilesResult.stdout.trim().split('\n');
            precommitReport.blockingIssues.push({
              gateId: 'PC2',
              description: `releasing 证据包目录 (${trackedFiles.length} 个文件) 已被 git 跟踪，不应提交`,
              evidencePath: '06_releasing/',
              suggestion: '请将 06_releasing/ 添加到 .gitignore，或从 git 历史中移除'
            });
            console.log(`[Stage-Executor] ❌ PC2: releasing 目录已被 git 跟踪（${trackedFiles.length} 个文件）`);
          } else {
            console.log('[Stage-Executor] ✅ PC2: releasing 目录未被 git 跟踪');
          }
        } catch (error) {
          console.log('[Stage-Executor] ⚠️ PC2: 无法检查 releasing 目录跟踪状态:', error.message);
        }
      }

      // Step C: 汇总结果，判定 PASS/FAIL
      console.log('[Stage-Executor] 汇总 precommit 检查结果...');
      
      // PC0: 敏感文件检查
      if (precommitReport.securityFindings.length > 0) {
        precommitReport.result = 'FAIL';
        for (const finding of precommitReport.securityFindings) {
          precommitReport.blockingIssues.push({
            gateId: finding.gateId,
            description: finding.recommendation,
            evidencePath: `07_precommit/PRECOMMIT_REPORT.json`,
            suggestion: '请移除敏感文件或将其添加到 .gitignore'
          });
        }
      }
      
      // PC1: 未跟踪文件检查（硬阻断：不在白名单的未跟踪文件必须 FAIL）
      if (precommitReport.untrackedFiles.length > 0) {
        precommitReport.result = 'FAIL';
        for (const untracked of precommitReport.untrackedFiles) {
          precommitReport.blockingIssues.push({
            gateId: 'PC1',
            description: `未跟踪文件：${untracked.path}（不在白名单）`,
            evidencePath: '07_precommit/PRECOMMIT_REPORT.json',
            suggestion: untracked.isProtectedDir
              ? `受保护目录内容不应提交，请删除或加入 .gitignore：${untracked.path}`
              : `确认是否应提交；不应提交则删除或加入 .gitignore：${untracked.path}`
          });
        }
        console.log(`[Stage-Executor] ❌ PC1: 发现 ${precommitReport.untrackedFiles.length} 个未跟踪文件，阻断提交`);
      }
      
      // PC2: releasing 目录检查（已在 B3 中添加到 blockingIssues）
      
      // 更新 summary
      precommitReport.summary = {
        totalDeleted: precommitReport.deleted.length,
        totalSecurityFindings: precommitReport.securityFindings.length,
        totalUntrackedFiles: precommitReport.untrackedFiles.length,
        totalBlockingIssues: precommitReport.blockingIssues.length
      };

      // Step D: 写入 PRECOMMIT_REPORT.json
      fs.writeFileSync(
        path.join(precommitPath, 'PRECOMMIT_REPORT.json'),
        JSON.stringify(precommitReport, null, 2),
        'utf8'
      );
      console.log('[Stage-Executor] ✅ PRECOMMIT_REPORT.json 已生成');

      // Step E: 生成 PRECOMMIT_SUMMARY.md
      console.log('[Stage-Executor] 生成 PRECOMMIT_SUMMARY.md...');
      const summaryContent = `# Precommit 检查报告

## 执行信息
- 时间：${precommitReport.executedAt}
- 项目路径：${projectPath}

## 检查结果
**RESULT: ${precommitReport.result}**

## Gate 检查
| Gate | 描述 | 状态 |
|------|------|------|
| PC0 | 敏感文件检查 | ${precommitReport.securityFindings.length > 0 ? '❌ FAIL' : '✅ PASS'} |
| PC1 | 未跟踪文件检查 | ${precommitReport.untrackedFiles.length > 0 ? '❌ FAIL' : '✅ PASS'} |
| PC2 | releasing 目录检查 | ${precommitReport.blockingIssues.some(i => i.gateId === 'PC2') ? '❌ FAIL' : '✅ PASS'} |

## 发现汇总
- 敏感文件：${precommitReport.summary.totalSecurityFindings}
- 未跟踪文件：${precommitReport.summary.totalUntrackedFiles}
- Blocking Issues: ${precommitReport.summary.totalBlockingIssues}

## Blocking Issues
${precommitReport.blockingIssues.length > 0 
  ? precommitReport.blockingIssues.map(i => `- **${i.gateId}**: ${i.description}`).join('\n')
  : '无'}

## 下一步
${precommitReport.result === 'PASS' 
  ? '✅ 可以安全提交代码' 
  : '❌ 请先修复上述问题后再提交'}
`;
      fs.writeFileSync(
        path.join(precommitPath, 'PRECOMMIT_SUMMARY.md'),
        summaryContent,
        'utf8'
      );
      console.log('[Stage-Executor] ✅ PRECOMMIT_SUMMARY.md 已生成');

      console.log('[Stage-Executor] ✅ Precommit 阶段完成');
      console.log(`[Stage-Executor]   结果：${precommitReport.result}`);
      console.log(`[Stage-Executor]   Blocking Issues: ${precommitReport.summary.totalBlockingIssues}`);
      
      // 如果有 blocking issues，返回 success=false
      if (precommitReport.result === 'FAIL') {
        return {
          success: false,
          outputs: [
            path.join(precommitPath, 'PRECOMMIT_PLAN.json'),
            path.join(precommitPath, 'PRECOMMIT_REPORT.json'),
            path.join(precommitPath, 'PRECOMMIT_SUMMARY.md')
          ],
          error: `Precommit 检查失败：发现 ${precommitReport.summary.totalBlockingIssues} 个 blocking issues`
        };
      }
      
      return {
        success: true,
        outputs: [
          path.join(precommitPath, 'PRECOMMIT_PLAN.json'),
          path.join(precommitPath, 'PRECOMMIT_REPORT.json'),
          path.join(precommitPath, 'PRECOMMIT_SUMMARY.md')
        ]
      };

    } catch (error) {
      console.error('[Stage-Executor] ❌ Precommit 阶段执行失败:', error.message);
      return {
        success: false,
        outputs: [],
        error: error.message
      };
    }
  }

  /**
   * 执行 Releasing 阶段（发布动作执行 + cleanup 清理）
   */
  async executeReleasing(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：RELEASING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const releasingPath = path.join(projectPath, '06_releasing');
    
    // P0-1 修复：Step A - 读取并校验 readiness
    console.log('[Stage-Executor] 校验 Release Readiness...');
    const readinessPath = path.join(projectPath, '05_reviewing', 'RELEASE_READINESS.json');
    
    if (!fs.existsSync(readinessPath)) {
      console.error('[Stage-Executor] ❌ RELEASE_READINESS.json 文件不存在');
      return {
        success: false,
        outputs: [],
        error: 'RELEASE_READINESS.json 文件不存在，请先完成 reviewing 阶段'
      };
    }
    
    let readiness;
    try {
      readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));
    } catch (error) {
      console.error('[Stage-Executor] ❌ RELEASE_READINESS.json 解析失败:', error.message);
      return {
        success: false,
        outputs: [],
        error: `RELEASE_READINESS.json 解析失败：${error.message}`
      };
    }
    
    if (readiness.result !== 'PASS') {
      console.error(`[Stage-Executor] ❌ Release Readiness 检查结果为 ${readiness.result}，不允许发布`);
      const blockingIssues = readiness.blockingIssues || [];
      const firstIssue = blockingIssues[0] ? ` - ${blockingIssues[0].gateId}: ${blockingIssues[0].description}` : '';
      return {
        success: false,
        outputs: [],
        error: `Release Readiness 检查结果为 ${readiness.result}，不允许发布${firstIssue}`
      };
    }
    
    console.log('[Stage-Executor] ✅ Release Readiness 检查通过（result=PASS）');
    
    // P0-1 修复：Step C - 通过后才生成发布证据包
    // 确保目录存在
    if (!fs.existsSync(releasingPath)) {
      fs.mkdirSync(releasingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${releasingPath}`);
    }

    try {
      // 1. 生成 RELEASE_RECORD.json（发布记录）- 引用真实 readiness.result
      console.log('[Stage-Executor] 生成 RELEASE_RECORD.json...');
      const releaseRecord = {
        schemaVersion: 'v1',
        releaseId: `release-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        readiness: {
          path: '05_reviewing/RELEASE_READINESS.json',
          result: readiness.result  // P0-1 修复：引用真实 result，不写死
        },
        inputs: {
          projectPath: projectPath,
          attempt: input.attempt || 1
        },
        cleanup: {
          planPath: '06_releasing/CLEANUP_PLAN.json',
          reportPath: '06_releasing/CLEANUP_REPORT.json',
          summary: {
            deletedCount: 0,
            securityFindingsCount: 0
          }
        },
        outputs: {
          releaseNotes: '06_releasing/RELEASE_NOTES.md',
          artifactManifest: '06_releasing/ARTIFACT_MANIFEST.json'
        }
      };
      fs.writeFileSync(
        path.join(releasingPath, 'RELEASE_RECORD.json'),
        JSON.stringify(releaseRecord, null, 2),
        'utf8'
      );
      console.log('[Stage-Executor] ✅ RELEASE_RECORD.json 已生成');

      // 2. 生成 CLEANUP_PLAN.json（清理计划）
      console.log('[Stage-Executor] 生成 CLEANUP_PLAN.json...');
      const cleanupPlan = {
        version: 'v1',
        generatedAt: new Date().toISOString(),
        protectedDirectories: [
          '01_designing/',
          '02_roadmapping/',
          '03_detailing/',
          '04_coding/',
          '05_testing/',
          '05_reviewing/',
          '06_releasing/'
        ],
        protectedFiles: [
          'PROJECT_MANIFEST.json',
          'REQUIREMENTS.md'
        ],
        cleanupRules: [
          { pattern: '.DS_Store', reason: '系统临时文件' },
          { pattern: 'Thumbs.db', reason: '系统临时文件' },
          { pattern: '*.tmp', reason: '临时文件' },
          { pattern: '*.swp', reason: '编辑器交换文件' },
          { pattern: '*~', reason: '备份文件' },
          { pattern: '__pycache__/', reason: 'Python 缓存' },
          { pattern: '*.pyc', reason: 'Python 编译文件' }
        ],
        securityScan: {
          enabled: true,
          patterns: ['.env', '*.pem', '*.key', 'id_rsa', '*.p12']
        }
      };
      fs.writeFileSync(
        path.join(releasingPath, 'CLEANUP_PLAN.json'),
        JSON.stringify(cleanupPlan, null, 2),
        'utf8'
      );
      console.log('[Stage-Executor] ✅ CLEANUP_PLAN.json 已生成');

      // 3. 执行清理并生成 CLEANUP_REPORT.json
      console.log('[Stage-Executor] 执行清理...');
      const cleanupReport = {
        version: 'v1',
        executedAt: new Date().toISOString(),
        deletedFiles: [],
        securityFindings: [],
        summary: {
          totalDeleted: 0,
          totalSecurityFindings: 0
        }
      };
      
      // 扫描项目根目录，匹配清理规则和安全模式
      const cleanupRules = cleanupPlan.cleanupRules.map(r => r.pattern);
      const securityPatterns = cleanupPlan.securityScan.patterns;
      
      console.log('[Stage-Executor] 扫描临时文件和安全风险...');
      
      // 简单实现：扫描项目根目录的一级文件/目录
      try {
        const rootItems = fs.readdirSync(projectPath);
        
        for (const item of rootItems) {
          const itemPath = path.join(projectPath, item);
          const stat = fs.statSync(itemPath);
          
          // 跳过受保护的目录
          if (stat.isDirectory() && cleanupPlan.protectedDirectories.some(d => itemPath.includes(d))) {
            continue;
          }
          
          // 检查是否匹配清理规则
          for (const pattern of cleanupRules) {
            if (pattern.startsWith('*') && item.endsWith(pattern.slice(1))) {
              // 匹配临时文件，记录到 deletedFiles
              cleanupReport.deletedFiles.push({
                path: item,
                reason: `匹配清理规则：${pattern}`,
                deleted: false  // 简化实现：只记录不删除
              });
              cleanupReport.summary.totalDeleted++;
              console.log(`[Stage-Executor] 发现临时文件：${item} (${pattern})`);
              break;
            }
          }
          
          // 检查是否匹配安全模式（敏感文件）
          for (const pattern of securityPatterns) {
            if ((pattern.startsWith('*') && item.endsWith(pattern.slice(1))) || 
                (pattern === item)) {
              // 匹配敏感文件，记录到 securityFindings
              cleanupReport.securityFindings.push({
                path: item,
                pattern: pattern,
                severity: 'HIGH',
                recommendation: `建议删除或加入 .gitignore：${item}`
              });
              cleanupReport.summary.totalSecurityFindings++;
              console.log(`[Stage-Executor] ⚠️ 发现敏感文件：${item} (${pattern})`);
              break;
            }
          }
        }
      } catch (error) {
        console.error('[Stage-Executor] ⚠️ 扫描失败:', error.message);
      }
      
      // 更新 summary
      cleanupReport.summary.totalDeleted = cleanupReport.deletedFiles.length;
      cleanupReport.summary.totalSecurityFindings = cleanupReport.securityFindings.length;
      
      fs.writeFileSync(
        path.join(releasingPath, 'CLEANUP_REPORT.json'),
        JSON.stringify(cleanupReport, null, 2),
        'utf8'
      );
      console.log('[Stage-Executor] ✅ CLEANUP_REPORT.json 已生成');
      console.log(`[Stage-Executor]   删除文件数：${cleanupReport.summary.totalDeleted}`);
      console.log(`[Stage-Executor]   安全发现数：${cleanupReport.summary.totalSecurityFindings}`);

      // 4. 生成 RELEASE_NOTES.md（发布说明）- 引用真实 readiness.result
      console.log('[Stage-Executor] 生成 RELEASE_NOTES.md...');
      const releaseNotes = `# 发布说明 - Releasing 阶段

## 发布信息
- 发布时间：${new Date().toISOString()}
- 发布 ID: ${releaseRecord.releaseId}

## 发布就绪
- Reviewing 放行凭证：05_reviewing/RELEASE_READINESS.json
- 结果：${readiness.result}

## 清理报告
- 删除文件数：${cleanupReport.summary.totalDeleted}
- 安全发现数：${cleanupReport.summary.totalSecurityFindings}

## 制品清单
详见：06_releasing/ARTIFACT_MANIFEST.json

## 发布记录
详见：06_releasing/RELEASE_RECORD.json
`;
      fs.writeFileSync(
        path.join(releasingPath, 'RELEASE_NOTES.md'),
        releaseNotes,
        'utf8'
      );
      console.log('[Stage-Executor] ✅ RELEASE_NOTES.md 已生成');

      // 5. 生成 ARTIFACT_MANIFEST.json（制品清单）
      console.log('[Stage-Executor] 生成 ARTIFACT_MANIFEST.json...');
      const artifactManifest = {
        version: 'v1',
        generatedAt: new Date().toISOString(),
        artifacts: [
          {
            path: '06_releasing/RELEASE_RECORD.json',
            type: 'record',
            description: '发布记录'
          },
          {
            path: '06_releasing/RELEASE_NOTES.md',
            type: 'notes',
            description: '发布说明'
          },
          {
            path: '06_releasing/CLEANUP_PLAN.json',
            type: 'cleanup',
            description: '清理计划'
          },
          {
            path: '06_releasing/CLEANUP_REPORT.json',
            type: 'cleanup',
            description: '清理报告'
          }
        ]
      };
      fs.writeFileSync(
        path.join(releasingPath, 'ARTIFACT_MANIFEST.json'),
        JSON.stringify(artifactManifest, null, 2),
        'utf8'
      );
      console.log('[Stage-Executor] ✅ ARTIFACT_MANIFEST.json 已生成');

      // 更新 releaseRecord 中的 cleanup summary
      releaseRecord.cleanup.summary.deletedCount = cleanupReport.summary.totalDeleted;
      releaseRecord.cleanup.summary.securityFindingsCount = cleanupReport.summary.totalSecurityFindings;
      fs.writeFileSync(
        path.join(releasingPath, 'RELEASE_RECORD.json'),
        JSON.stringify(releaseRecord, null, 2),
        'utf8'
      );

      console.log('[Stage-Executor] ✅ Releasing 阶段完成');
      console.log(`[Stage-Executor]   产出：${artifactManifest.artifacts.length + 1} 个文件`);
      
      return {
        success: true,
        outputs: [
          path.join(releasingPath, 'RELEASE_RECORD.json'),
          path.join(releasingPath, 'RELEASE_NOTES.md'),
          path.join(releasingPath, 'ARTIFACT_MANIFEST.json'),
          path.join(releasingPath, 'CLEANUP_PLAN.json'),
          path.join(releasingPath, 'CLEANUP_REPORT.json')
        ]
      };

    } catch (error) {
      console.error('[Stage-Executor] ❌ Releasing 阶段执行失败:', error.message);
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
