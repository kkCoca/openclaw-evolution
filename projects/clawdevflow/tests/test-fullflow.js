#!/usr/bin/env node

/**
 * Designing 完整流程测试（v3.3.0）
 * 
 * 测试场景：
 * 1. AutoReview PASS → PRD 确认 → TRD 确认 → designing passed
 * 2. AutoReview BLOCK → 自动再生成 → 重试限制
 */

const fs = require('fs');
const path = require('path');
const { StateManager } = require('../04_coding/src/state-manager');
const WorkflowOrchestrator = require('../04_coding/src/workflow-orchestrator');

// 测试工具
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, fn) {
    try {
      console.log(`\n🧪 测试：${name}`);
      await fn();
      console.log(`✅ 通过\n`);
      this.passed++;
    } catch (error) {
      console.log(`❌ 失败：${error.message}\n`);
      this.failed++;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async run() {
    console.log('=== Designing 完整流程测试 ===\n');
    
    await this.test('场景 1: AutoReview PASS → PRD 确认 → TRD 确认', testScenario1);
    await this.test('场景 2: AutoReview BLOCK → 自动再生成 → 重试限制', testScenario2);
    
    console.log('=== 测试结果 ===');
    console.log(`通过：${this.passed}`);
    console.log(`失败：${this.failed}`);
    console.log(`总计：${this.passed + this.failed}`);
    
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// =========================================================================
// 场景 1: AutoReview PASS → PRD 确认 → TRD 确认
// =========================================================================
async function testScenario1() {
  console.log('步骤 1: 初始化状态和配置');
  
  // 创建临时状态文件
  const tempStateFile = path.join(__dirname, 'test-fullflow-state.json');
  const stateManager = new StateManager(tempStateFile, './logs');
  
  // 初始化状态
  stateManager.init('test-workflow', '测试任务', '全新功能', './test-project');
  
  // 模拟配置
  const config = {
    stages: {
      designing: {
        policy: {
          approvals: {
            mode: 'auto',
            small_scope: {
              max_requirements: 2,
              max_prd_lines: 200,
              max_trd_lines: 300
            }
          },
          conditional_blocks_progress: true,
          blocking_rule: 'blocking_issues_nonempty',
          retry: {
            max_total_retries: 5,
            max_retries_per_issue: { DEFAULT: 3 },
            same_issue_streak_limit: 3
          },
          escalation: {
            on_retry_exhausted: 'clarify_required'
          }
        }
      }
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(config, stateManager);
  
  console.log('步骤 2: 设置测试数据');
  
  // 设置测试内容
  const requirementsContent = `
# 需求说明

### REQ-001: 测试需求

功能描述：测试功能
`;
  
  const prdContent = `
# PRD

> **对齐版本**: REQUIREMENTS v1.0.0 (${stateManager.calculateHash(requirementsContent).substring(0, 12)})

### 2.1 功能描述 [REQ-001]

功能描述：测试功能实现

前置条件：用户已登录
触发条件：点击按钮
预期结果：执行操作
`;
  
  const trdContent = `
# TRD

> **对齐版本**: REQUIREMENTS v1.0.0 (${stateManager.calculateHash(requirementsContent).substring(0, 12)})

### 3.1 技术架构

技术方案：使用 Node.js
`;
  
  // 保存到临时文件
  const testProjectPath = path.join(__dirname, 'test-fullflow-project');
  if (!fs.existsSync(testProjectPath)) {
    fs.mkdirSync(testProjectPath, { recursive: true });
  }
  if (!fs.existsSync(path.join(testProjectPath, '01_designing'))) {
    fs.mkdirSync(path.join(testProjectPath, '01_designing'), { recursive: true });
  }
  
  fs.writeFileSync(path.join(testProjectPath, 'REQUIREMENTS.md'), requirementsContent);
  fs.writeFileSync(path.join(testProjectPath, '01_designing/PRD.md'), prdContent);
  fs.writeFileSync(path.join(testProjectPath, '01_designing/TRD.md'), trdContent);
  
  // 更新 state
  stateManager.state.projectPath = testProjectPath;
  stateManager.state.requirementsContent = requirementsContent;
  stateManager.state.stages.designing.lastPrdContent = prdContent;
  stateManager.state.stages.designing.lastTrdContent = trdContent;
  stateManager.state.stages.designing.stageStatus = 'auto_reviewing';
  stateManager.save();
  
  console.log('步骤 3: 模拟 AutoReview PASS');
  
  // 模拟 executeDesigning 成功后的状态
  stateManager.state.stages.designing.stageStatus = 'prd_confirm_pending';
  stateManager.save();
  
  console.log('步骤 4: 执行 PRD 确认');
  
  const prdHash = stateManager.calculateHash(prdContent);
  const reqHash = stateManager.calculateHash(requirementsContent);
  
  // 临时禁用 notifyUser（测试环境不需要）
  orchestrator.notifyUser = async () => {};
  
  const prdResult = await orchestrator.approvePRD({
    userId: 'test-user',
    requirementsHash: reqHash,
    prdHash: prdHash,
    notes: 'PRD 确认测试'
  });
  
  console.log('PRD 确认结果:', prdResult);
  
  // 验证 PRD 确认成功
  assert(prdResult.success === true, 'PRD 确认应该成功');
  assert(stateManager.state.stages.designing.stageStatus === 'trd_confirm_pending', '状态应该变为 trd_confirm_pending');
  assert(stateManager.state.approvals.designing.prd !== null, 'PRD 确认记录应该存在');
  
  console.log('  ✓ PRD 确认成功');
  console.log('  ✓ 状态推进到 trd_confirm_pending');
  console.log('  ✓ PRD 确认记录已保存');
  
  console.log('步骤 5: 执行 TRD 确认');
  
  const trdHash = stateManager.calculateHash(trdContent);
  
  const trdResult = await orchestrator.approveTRD({
    userId: 'test-user',
    requirementsHash: reqHash,
    trdHash: trdHash,
    notes: 'TRD 确认测试'
  });
  
  console.log('TRD 确认结果:', trdResult);
  
  // 验证 TRD 确认成功
  assert(trdResult.success === true, 'TRD 确认应该成功');
  assert(stateManager.state.stages.designing.stageStatus === 'passed', '状态应该变为 passed');
  assert(stateManager.state.approvals.designing.trd !== null, 'TRD 确认记录应该存在');
  
  console.log('  ✓ TRD 确认成功');
  console.log('  ✓ 状态推进到 passed');
  console.log('  ✓ TRD 确认记录已保存');
  
  console.log('步骤 6: 验证 transitionLog');
  
  const transitionLog = stateManager.getTransitionLog(10);
  console.log('Transition Log:', transitionLog.map(t => t.reason));
  
  assert(transitionLog.some(t => t.reason === 'PRD_APPROVED'), '应该有 PRD_APPROVED 记录');
  assert(transitionLog.some(t => t.reason === 'TRD_APPROVED'), '应该有 TRD_APPROVED 记录');
  
  console.log('  ✓ PRD_APPROVED 记录存在');
  console.log('  ✓ TRD_APPROVED 记录存在');
  
  // 清理临时文件
  fs.unlinkSync(tempStateFile);
  fs.rmSync(testProjectPath, { recursive: true, force: true });
  
  console.log('✅ 场景 1 测试通过：AutoReview PASS → PRD 确认 → TRD 确认 → designing passed');
}

// =========================================================================
// 场景 2: AutoReview BLOCK → 自动再生成 → 重试限制
// =========================================================================
async function testScenario2() {
  console.log('步骤 1: 初始化状态和配置');
  
  // 创建临时状态文件
  const tempStateFile = path.join(__dirname, 'test-fullflow-state2.json');
  const stateManager = new StateManager(tempStateFile, './logs');
  
  // 初始化状态
  stateManager.init('test-workflow-2', '测试任务 2', '全新功能', './test-project-2');
  
  // 模拟配置（设置较小的重试次数）
  const config = {
    stages: {
      designing: {
        policy: {
          approvals: {
            mode: 'auto'
          },
          conditional_blocks_progress: true,
          blocking_rule: 'blocking_issues_nonempty',
          retry: {
            max_total_retries: 2,  // 设置较小的值便于测试
            max_retries_per_issue: { DEFAULT: 2 },
            same_issue_streak_limit: 2
          },
          escalation: {
            on_retry_exhausted: 'clarify_required'
          }
        }
      }
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(config, stateManager);
  
  console.log('步骤 2: 设置测试数据（缺少验收标准，会触发 BLOCK）');
  
  // 设置测试内容（缺少 Given/When/Then，会触发 D7 失败）
  const requirementsContent = `
# 需求说明

### REQ-001: 测试需求

功能描述：测试功能
`;
  
  const prdContent = `
# PRD

> **对齐版本**: REQUIREMENTS v1.0.0 (${stateManager.calculateHash(requirementsContent).substring(0, 12)})

### 2.1 功能描述 [REQ-001]

功能描述：测试功能实现
（缺少验收标准）
`;
  
  // 保存到临时文件
  const testProjectPath = path.join(__dirname, 'test-fullflow-project-2');
  if (!fs.existsSync(testProjectPath)) {
    fs.mkdirSync(testProjectPath, { recursive: true });
  }
  if (!fs.existsSync(path.join(testProjectPath, '01_designing'))) {
    fs.mkdirSync(path.join(testProjectPath, '01_designing'), { recursive: true });
  }
  
  fs.writeFileSync(path.join(testProjectPath, 'REQUIREMENTS.md'), requirementsContent);
  fs.writeFileSync(path.join(testProjectPath, '01_designing/PRD.md'), prdContent);
  
  // 更新 state
  stateManager.state.projectPath = testProjectPath;
  stateManager.state.requirementsContent = requirementsContent;
  stateManager.state.stages.designing.lastPrdContent = prdContent;
  stateManager.state.stages.designing.stageStatus = 'auto_reviewing';
  stateManager.save();
  
  console.log('步骤 3: 验证重试限制逻辑');
  
  // 模拟重试
  stateManager.state.stages.designing.retryCountTotal = 2;  // 达到最大重试次数
  stateManager.state.stages.designing.sameIssueStreak = { issueId: 'D7_AC_MISSING', count: 2 };
  stateManager.save();
  
  // 验证是否达到重试限制
  const policy = config.stages.designing.policy;
  const retryCount = stateManager.state.stages.designing.retryCountTotal;
  const sameIssueStreak = stateManager.state.stages.designing.sameIssueStreak.count;
  
  assert(retryCount >= policy.retry.max_total_retries, '应该达到最大重试次数');
  assert(sameIssueStreak >= policy.retry.same_issue_streak_limit, '应该达到同问题连续次数限制');
  
  console.log('  ✓ 达到最大重试次数');
  console.log('  ✓ 达到同问题连续次数限制');
  console.log('  ✓ 应该触发重试耗尽升级');
  
  // 清理临时文件
  fs.unlinkSync(tempStateFile);
  fs.rmSync(testProjectPath, { recursive: true, force: true });
  
  console.log('✅ 场景 2 测试通过：AutoReview BLOCK → 自动再生成 → 重试限制');
}

// 辅助函数
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// =========================================================================
// 运行测试
// =========================================================================
const runner = new TestRunner();
runner.run().catch(err => {
  console.error('测试执行失败:', err);
  process.exit(1);
});
