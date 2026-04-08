/**
 * Review Orchestrator (审阅编排器)
 * 
 * ClawDevFlow (CDF) 审阅系统统一调用入口
 * 协调各个 Review Agent 和审阅工作流
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const ReviewDesignAgent = require('../review-agents/review-design');
const ReviewCodeAgent = require('../review-agents/review-code');
const ReviewRoadmapAgentV1 = require('../review-agents/review-roadmap-v1');
const ReviewWorkflow = require('./review-workflow');

/**
 * 审阅编排器
 */
class ReviewOrchestrator {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config || {};
    this.agents = {
      designing: new ReviewDesignAgent(config),
      coding: new ReviewCodeAgent(config),
      roadmapping: new ReviewRoadmapAgentV1(config)
      // detailing 使用最小规则检查（硬编码）
    };
    this.workflow = new ReviewWorkflow(config);
    
    console.log('[Review-Orchestrator] 审阅编排器初始化完成');
    console.log('[Review-Orchestrator] 已注册 Agent:');
    Object.keys(this.agents).forEach(stage => {
      console.log(`  - ${stage}: ${this.agents[stage].constructor.name}`);
    });
  }

  /**
   * 执行阶段审阅
   * 
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段产出输入
   * @param {object} outputs - 阶段产出列表
   * @param {string} projectPath - 项目路径
   * @returns {Promise<ReviewDecision>} 审阅结论
   * 
   * @example
   * ```javascript
   * const orchestrator = new ReviewOrchestrator(config);
   * const decision = await orchestrator.review('designing', input, outputs, projectPath);
   * console.log(decision); // { decision: 'pass', notes: '...', fixItems: [] }
   * ```
   */
  async review(stageName, input, outputs, projectPath) {
    console.log('');
    console.log('[Review-Orchestrator] ════════════════════════════════════');
    console.log('[Review-Orchestrator] 开始阶段审阅');
    console.log(`[Review-Orchestrator]   阶段：${stageName}`);
    console.log(`[Review-Orchestrator]   项目：${projectPath}`);
    console.log('[Review-Orchestrator] ════════════════════════════════════');
    console.log('');

    try {
      // 审阅模式分流：
      // - designing: 走现有 workflow.execute()（人工确认）
      // - roadmapping: 走自动审阅（ReviewRoadmapAgentV1）并直接返回
      // - detailing: 走自动审阅（最小规则）并直接返回
      // - coding: 走自动审阅（真执行命令）
      // - testing: 走自动审阅（检查证据包）
      // - reviewing: 走自动审阅（检查产物齐全）
      
      if (stageName === 'roadmapping' || stageName === 'detailing' || stageName === 'coding' || stageName === 'testing' || stageName === 'reviewing') {
        // 自动审阅模式（roadmapping/detailing/coding/testing/reviewing）
        console.log('[Review-Orchestrator] 步骤 1/1: 执行自动审阅...');
        const decision = await this.executeAutoReview(stageName, input, projectPath);
        console.log('[Review-Orchestrator] ✅ 自动审阅完成');
        console.log('');
        return decision;
      } else {
        // 人工确认模式（designing/coding）
        const agent = this.agents[stageName];
        
        if (!agent) {
          throw new Error(`未知的审阅阶段：${stageName}`);
        }

        // 2. 执行自动检查
        console.log('[Review-Orchestrator] 步骤 1/2: 执行自动检查...');
        const autoResults = await agent.execute(input);
        console.log('[Review-Orchestrator] ✅ 自动检查完成');
        console.log('');

        // 3. 执行审阅工作流
        console.log('[Review-Orchestrator] 步骤 2/2: 执行审阅工作流...');
        const decision = await this.workflow.execute(
          stageName,
          autoResults,
          outputs,
          projectPath
        );
        console.log('[Review-Orchestrator] ✅ 审阅工作流完成');
        console.log('');

        // 4. 返回审阅结论
        return decision;
      }

    } catch (error) {
      console.error('[Review-Orchestrator] ❌ 审阅失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行自动审阅（roadmapping/detailing）
   * @param {string} stageName - 阶段名称
   * @param {object} input - 输入数据
   * @param {string} projectPath - 项目路径
   * @returns {Promise<ReviewDecision>} 审阅结论
   */
  async executeAutoReview(stageName, input, projectPath) {
    if (stageName === 'roadmapping') {
      // Roadmapping: 使用 ReviewRoadmapAgentV1
      const agent = this.agents.roadmapping;
      
      // 从文件系统读取 ROADMAP.md（P0 修复：避免审阅空文本）
      const roadmapPath = path.join(projectPath, '02_roadmapping/ROADMAP.md');
      if (!fs.existsSync(roadmapPath)) {
        // 问题 A 修复：clarify → reject（触发自动返工）
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
      
      // 空内容判空（v3.5.0 修复）：clarify → reject（触发自动返工）
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
      
      // 转换审阅报告为 decision（问题 A 修复：report.error → reject）
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
      } else {
        // reject/conditional → 返回 reject 触发自动返工
        const blockingIssues = [];
        
        if (!report.gates.traceability?.passed) {
          blockingIssues.push({
            id: 'TRACEABILITY_FAILED',
            message: report.gates.traceability.reason,
            regenerateHint: report.gates.traceability.suggestion
          });
        }
        
        if (!report.gates.structure?.passed) {
          blockingIssues.push({
            id: 'STRUCTURE_FAILED',
            message: report.gates.structure.reason,
            regenerateHint: report.gates.structure.suggestion
          });
        }
        
        if (!report.qualityChecks.scope?.passed) {
          blockingIssues.push({
            id: 'SCOPE_FAILED',
            message: report.qualityChecks.scope.issues?.[0],
            regenerateHint: report.qualityChecks.scope.suggestions?.[0]
          });
        }
        
        return {
          decision: 'reject',
          notes: `自动审阅失败：${blockingIssues.length} 个 blocking issue`,
          fixItems: blockingIssues.map(issue => ({
            id: issue.id,
            description: issue.message,
            suggestion: issue.regenerateHint
          }))
        };
      }
      
    } else if (stageName === 'detailing') {
      // Detailing: 最小规则检查
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
      
      // 空内容判空
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
      
      // 最小规则检查：关键章节关键词
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
      
      // 所有检查通过
      return {
        decision: 'pass',
        notes: '所有检查通过',
        fixItems: []
      };
    } else if (stageName === 'coding') {
      // Coding: 真执行命令（Gate C0-C5）
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const manifestPath = input.manifestFile || path.join(projectPath, 'PROJECT_MANIFEST.json');
      
      // Gate C0: PROJECT_MANIFEST.json 存在
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
      
      // Gate C1: 解析 manifest 并验证 commands.test 存在
      let manifest;
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (error) {
        return {
          decision: 'reject',
          notes: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
          fixItems: [{
            id: 'MANIFEST_INVALID',
            description: 'PROJECT_MANIFEST.json 不是有效的 JSON',
            suggestion: '请修复 PROJECT_MANIFEST.json 格式'
          }]
        };
      }
      
      if (!manifest.commands || !manifest.commands.test) {
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
      
      // Gate C2: 执行 commands.test
      const testCmd = manifest.commands.test;
      try {
        console.log(`[Review-Orchestrator] 执行测试命令：${testCmd}`);
        const testResult = await execAsync(testCmd, { 
          cwd: projectPath,
          timeout: 300000 // 5 分钟超时
        });
        console.log('[Review-Orchestrator] ✅ 测试通过');
      } catch (error) {
        return {
          decision: 'reject',
          notes: `测试命令执行失败：${error.message}`,
          fixItems: [{
            id: 'TEST_FAILED',
            description: `测试命令执行失败：${error.message}`,
            suggestion: '请修复测试失败问题'
          }]
        };
      }
      
      // Gate C3: 若 commands.lint 存在则必须通过
      if (manifest.commands.lint) {
        const lintCmd = manifest.commands.lint;
        try {
          console.log(`[Review-Orchestrator] 执行 Lint 命令：${lintCmd}`);
          await execAsync(lintCmd, { 
            cwd: projectPath,
            timeout: 300000
          });
          console.log('[Review-Orchestrator] ✅ Lint 通过');
        } catch (error) {
          return {
            decision: 'reject',
            notes: `Lint 命令执行失败：${error.message}`,
            fixItems: [{
              id: 'LINT_FAILED',
              description: `Lint 命令执行失败：${error.message}`,
              suggestion: '请修复 Lint 问题'
            }]
          };
        }
      }
      
      // Gate C4: 若 commands.build 存在则必须通过
      if (manifest.commands.build) {
        const buildCmd = manifest.commands.build;
        try {
          console.log(`[Review-Orchestrator] 执行构建命令：${buildCmd}`);
          await execAsync(buildCmd, { 
            cwd: projectPath,
            timeout: 600000 // 10 分钟超时
          });
          console.log('[Review-Orchestrator] ✅ 构建通过');
        } catch (error) {
          return {
            decision: 'reject',
            notes: `构建命令执行失败：${error.message}`,
            fixItems: [{
              id: 'BUILD_FAILED',
              description: `构建命令执行失败：${error.message}`,
              suggestion: '请修复构建问题'
            }]
          };
        }
      }
      
      // Gate C5: CHANGESET.md 必存在且包含 test 命令
      const changesetPath = path.join(projectPath, '04_coding/CHANGESET.md');
      if (!fs.existsSync(changesetPath)) {
        return {
          decision: 'reject',
          notes: '04_coding/CHANGESET.md 文件不存在',
          fixItems: [{
            id: 'CHANGESET_MISSING',
            description: '04_coding/CHANGESET.md 文件不存在',
            suggestion: '请创建 CHANGESET.md 并说明如何跑 test/lint/build'
          }]
        };
      }
      
      const changesetContent = fs.readFileSync(changesetPath, 'utf8');
      if (!changesetContent.includes(testCmd)) {
        return {
          decision: 'reject',
          notes: 'CHANGESET.md 未包含 test 命令',
          fixItems: [{
            id: 'CHANGESET_NO_TEST',
            description: 'CHANGESET.md 未包含 test 命令',
            suggestion: `请在 CHANGESET.md 中添加 test 命令：${testCmd}`
          }]
        };
      }
      
      // 所有 Gate 通过
      return {
        decision: 'pass',
        notes: '所有质量门禁通过',
        fixItems: []
      };
    } else if (stageName === 'testing') {
      // Testing: 检查证据包（不重复执行命令）
      const testingPath = path.join(projectPath, '05_testing');
      
      // TG0: manifest 存在且可解析
      const manifestPath = input.manifestFile || path.join(projectPath, 'PROJECT_MANIFEST.json');
      if (!fs.existsSync(manifestPath)) {
        return {
          decision: 'reject',
          notes: 'PROJECT_MANIFEST.json 文件不存在',
          fixItems: [{
            id: 'TG0_MANIFEST_MISSING',
            description: 'PROJECT_MANIFEST.json 文件不存在',
            suggestion: '请创建 PROJECT_MANIFEST.json 并定义 commands.test/verify'
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
            id: 'TG0_MANIFEST_INVALID',
            description: 'PROJECT_MANIFEST.json 不是有效的 JSON',
            suggestion: '请修复 PROJECT_MANIFEST.json 格式'
          }]
        };
      }
      
      // TG1: TEST_RESULTS.json 存在
      const testResultsPath = path.join(testingPath, 'TEST_RESULTS.json');
      if (!fs.existsSync(testResultsPath)) {
        return {
          decision: 'reject',
          notes: '05_testing/TEST_RESULTS.json 文件不存在',
          fixItems: [{
            id: 'TG1_TEST_RESULTS_MISSING',
            description: 'TEST_RESULTS.json 文件不存在',
            suggestion: '请执行 Testing 阶段生成 TEST_RESULTS.json'
          }]
        };
      }
      
      // P0-1 修复：检查 TEST_RESULTS.json.RESULT === 'PASS'
      const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
      if (testResults.RESULT !== 'PASS') {
        return {
          decision: 'reject',
          notes: `测试未通过：${testResults.RESULT}`,
          fixItems: [{
            id: 'TG5_TEST_FAILED',  // P1 修复：与文档用例 3 对齐
            description: `测试失败：${testResults.ERROR || '未知错误'}`,
            suggestion: '请修复 failing tests / 修复依赖 / 更新断言，并重新执行 Testing 阶段'
          }]
        };
      }
      
      // TG2: VERIFY_RESULTS.json 存在
      const verifyResultsPath = path.join(testingPath, 'VERIFY_RESULTS.json');
      if (!fs.existsSync(verifyResultsPath)) {
        return {
          decision: 'reject',
          notes: '05_testing/VERIFY_RESULTS.json 文件不存在',
          fixItems: [{
            id: 'TG2_VERIFY_RESULTS_MISSING',
            description: 'VERIFY_RESULTS.json 文件不存在',
            suggestion: '请执行 Testing 阶段生成 VERIFY_RESULTS.json'
          }]
        };
      }
      
      // TG3: VERIFICATION_REPORT.md 存在
      const verificationReportPath = path.join(testingPath, 'VERIFICATION_REPORT.md');
      if (!fs.existsSync(verificationReportPath)) {
        return {
          decision: 'reject',
          notes: '05_testing/VERIFICATION_REPORT.md 文件不存在',
          fixItems: [{
            id: 'TG3_VERIFICATION_REPORT_MISSING',
            description: 'VERIFICATION_REPORT.md 文件不存在',
            suggestion: '请执行 Testing 阶段生成 VERIFICATION_REPORT.md'
          }]
        };
      }
      
      // TG4: report 字段完整
      const verifyResults = JSON.parse(fs.readFileSync(verifyResultsPath, 'utf8'));
      if (!verifyResults.VERIFY_CMD || !verifyResults.RESULT) {
        return {
          decision: 'reject',
          notes: 'VERIFY_RESULTS.json 缺少必需字段（VERIFY_CMD/RESULT）',
          fixItems: [{
            id: 'TG4_FIELDS_INCOMPLETE',
            description: 'VERIFY_RESULTS.json 缺少必需字段',
            suggestion: '请确保 VERIFY_RESULTS.json 包含 VERIFY_CMD 和 RESULT 字段'
          }]
        };
      }
      
      // P0-2 修复：检查 verify 命令是否缺失（来自 VERIFY_RESULTS.ERROR）
      if (verifyResults.ERROR === 'VERIFY_COMMAND_MISSING') {
        return {
          decision: 'reject',
          notes: 'PROJECT_MANIFEST.json 缺少 commands.verify 字段',
          fixItems: [{
            id: 'TG0_VERIFY_COMMAND_MISSING',  // P1 修复：与文档用例 2 对齐
            description: 'PROJECT_MANIFEST.json 缺少 commands.verify 字段',
            suggestion: '请在 PROJECT_MANIFEST.json 中添加 commands.verify 字段，建议使用 ./scripts/verify.sh 或自定义验收脚本'
          }]
        };
      }
      
      // TG5: VERIFY_RESULTS.pass == true（最终判定）
      if (verifyResults.RESULT !== 'PASS') {
        return {
          decision: 'reject',
          notes: `验收未通过：${verifyResults.RESULT}`,
          fixItems: [{
            id: 'TG5_VERIFY_FAILED',
            description: `验收失败：${verifyResults.ERROR || '未知错误'}`,
            suggestion: '请修复验收失败问题并重新执行 Testing 阶段'
          }]
        };
      }
      
      // 所有 Gate 通过
      return {
        decision: 'pass',
        notes: '所有 Testing Gates 通过',
        fixItems: []
      };
    } else if (stageName === 'reviewing') {
      // Reviewing: Release Readiness Gate（B 方案：自动计算 + 写回凭证）
      const reviewingPath = path.join(projectPath, '05_reviewing');
      const testingPath = path.join(projectPath, '05_testing');
      const codingPath = path.join(projectPath, '04_coding');
      
      const blockingIssues = [];
      
      // RG0: 05_reviewing/ 目录存在
      if (!fs.existsSync(reviewingPath)) {
        blockingIssues.push({
          stage: 'reviewing',
          gateId: 'RG0_REVIEWING_DIR_MISSING',
          description: '05_reviewing/ 目录不存在',
          suggestion: '执行 reviewing 阶段生成收口产物（FINAL_REPORT + readiness）',
          evidencePath: '05_reviewing/'
        });
      }
      
      // RG1: FINAL_REPORT.md 存在且非空
      const finalReportPath = path.join(reviewingPath, 'FINAL_REPORT.md');
      if (!fs.existsSync(finalReportPath)) {
        blockingIssues.push({
          stage: 'reviewing',
          gateId: 'RG1_FINAL_REPORT_MISSING',
          description: 'FINAL_REPORT.md 文件不存在',
          suggestion: '生成 FINAL_REPORT.md（范围/结论/风险/证据引用）',
          evidencePath: '05_reviewing/FINAL_REPORT.md'
        });
      } else {
        const stats = fs.statSync(finalReportPath);
        if (stats.size === 0) {
          blockingIssues.push({
            stage: 'reviewing',
            gateId: 'RG1_FINAL_REPORT_EMPTY',
            description: 'FINAL_REPORT.md 文件为空',
            suggestion: '填充收口报告（范围/结论/风险/证据引用）',
            evidencePath: '05_reviewing/FINAL_REPORT.md'
          });
        }
      }
      
      // RG2: testing 证据包完整
      const requiredTestingFiles = [
        '05_testing/TEST_RESULTS.json',
        '05_testing/VERIFY_RESULTS.json',
        '05_testing/VERIFICATION_REPORT.md'
      ];
      for (const file of requiredTestingFiles) {
        const filePath = path.join(projectPath, file);
        if (!fs.existsSync(filePath)) {
          blockingIssues.push({
            stage: 'testing',
            gateId: 'RG2_TESTING_EVIDENCE_MISSING',
            description: `${file} 文件不存在`,
            suggestion: '重新执行 testing 阶段生成完整 evidence pack',
            evidencePath: file
          });
        }
      }
      
      // RG3: testing 结果必须 PASS
      const testResultsPath = path.join(testingPath, 'TEST_RESULTS.json');
      const verifyResultsPath = path.join(testingPath, 'VERIFY_RESULTS.json');
      
      if (fs.existsSync(testResultsPath)) {
        const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
        if (testResults.RESULT !== 'PASS') {
          blockingIssues.push({
            stage: 'testing',
            gateId: 'RG3_TESTING_NOT_PASS',
            description: `测试未通过：${testResults.RESULT}`,
            suggestion: '修复 failing tests / 修复依赖 / 更新断言，并重跑 testing',
            evidencePath: '05_testing/TEST_RESULTS.json'
          });
        }
      }
      
      if (fs.existsSync(verifyResultsPath)) {
        const verifyResults = JSON.parse(fs.readFileSync(verifyResultsPath, 'utf8'));
        if (verifyResults.RESULT !== 'PASS') {
          blockingIssues.push({
            stage: 'testing',
            gateId: 'RG3_TESTING_NOT_PASS',
            description: `验收未通过：${verifyResults.RESULT}`,
            suggestion: '修复验收失败问题并重跑 testing',
            evidencePath: '05_testing/VERIFY_RESULTS.json'
          });
        }
      }
      
      // RG4: manifest 存在且有效
      const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
      if (!fs.existsSync(manifestPath)) {
        blockingIssues.push({
          stage: 'coding',
          gateId: 'RG4_MANIFEST_MISSING_OR_INVALID',
          description: 'PROJECT_MANIFEST.json 文件不存在',
          suggestion: '创建 PROJECT_MANIFEST.json 并定义 commands.test/verify',
          evidencePath: 'PROJECT_MANIFEST.json'
        });
      } else {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (!manifest.commands?.test || !manifest.commands?.verify) {
            blockingIssues.push({
              stage: 'coding',
              gateId: 'RG4_MANIFEST_MISSING_OR_INVALID',
              description: 'PROJECT_MANIFEST.json 缺少 commands.test 或 commands.verify 字段',
              suggestion: '补齐 commands.test 和 commands.verify 字段',
              evidencePath: 'PROJECT_MANIFEST.json'
            });
          }
        } catch (error) {
          blockingIssues.push({
            stage: 'coding',
            gateId: 'RG4_MANIFEST_MISSING_OR_INVALID',
            description: `PROJECT_MANIFEST.json 解析失败：${error.message}`,
            suggestion: '修复 PROJECT_MANIFEST.json 格式',
            evidencePath: 'PROJECT_MANIFEST.json'
          });
        }
      }
      
      // RG5: changeset 存在
      const changesetPath = path.join(codingPath, 'CHANGESET.md');
      if (!fs.existsSync(changesetPath)) {
        blockingIssues.push({
          stage: 'coding',
          gateId: 'RG5_CHANGESET_MISSING',
          description: 'CHANGESET.md 文件不存在',
          suggestion: '补齐变更说明与运行方式（test/lint/build/verify）',
          evidencePath: '04_coding/CHANGESET.md'
        });
      } else {
        const stats = fs.statSync(changesetPath);
        if (stats.size === 0) {
          blockingIssues.push({
            stage: 'coding',
            gateId: 'RG5_CHANGESET_MISSING',
            description: 'CHANGESET.md 文件为空',
            suggestion: '填充变更说明与运行方式',
            evidencePath: '04_coding/CHANGESET.md'
          });
        }
      }
      
      // 计算 readiness.result
      const result = blockingIssues.length === 0 ? 'PASS' : 'FAIL';
      
      // 写回 RELEASE_READINESS.json（B 方案核心：审阅阶段写文件）
      const readiness = {
        schemaVersion: 'v1',
        result: result,
        generatedAt: new Date().toISOString(),
        inputs: {
          projectPath: projectPath,
          attempt: input.attempt || 1
        },
        evidence: {
          manifest: 'PROJECT_MANIFEST.json',
          changeset: '04_coding/CHANGESET.md',
          testing: {
            test_results: '05_testing/TEST_RESULTS.json',
            verify_results: '05_testing/VERIFY_RESULTS.json',
            verification_report: '05_testing/VERIFICATION_REPORT.md'
          }
        },
        blockingIssues: blockingIssues
      };
      
      const readinessPath = path.join(reviewingPath, 'RELEASE_READINESS.json');
      fs.writeFileSync(readinessPath, JSON.stringify(readiness, null, 2), 'utf8');
      console.log(`[Review-Orchestrator] ✅ RELEASE_READINESS.json 已写入（result: ${result}）`);
      
      // RG6: 根据 readiness.result 决定 pass/reject
      if (result === 'PASS') {
        return {
          decision: 'pass',
          notes: 'Release Readiness 检查通过',
          fixItems: []
        };
      } else {
        return {
          decision: 'reject',
          notes: `Release Readiness 检查失败：${blockingIssues.length} 个 blocking issue`,
          fixItems: blockingIssues.map(issue => ({
            id: issue.gateId,
            description: issue.description,
            suggestion: issue.suggestion,
            evidencePath: issue.evidencePath
          }))
        };
      }
    }
    
    // 未知阶段
    return {
      decision: 'clarify',
      notes: `未知的自动审阅阶段：${stageName}`,
      fixItems: []
    };
  }

  /**
   * 获取可用的审阅阶段
   * @returns {string[]} 阶段列表
   */
  getAvailableStages() {
    return Object.keys(this.agents);
  }

  /**
   * 注册新的 Review Agent
   * @param {string} stageName - 阶段名称
   * @param {ReviewAgentBase} agent - Review Agent 实例
   */
  registerAgent(stageName, agent) {
    this.agents[stageName] = agent;
    console.log(`[Review-Orchestrator] 已注册 Agent: ${stageName}`);
  }
}

module.exports = ReviewOrchestrator;
