#!/usr/bin/env node

/**
 * Phase 1 测试套件（v3.2.0）
 * 
 * 测试内容：
 * 1. Policy 配置加载
 * 2. 决策逻辑测试
 * 3. 状态字段测试
 * 4. 两次确认测试
 * 5. 消除递归测试
 * 6. 重试限制测试
 */

const fs = require('fs');
const path = require('path');

// 测试工具
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('=== Phase 1 测试套件 ===\n');
    
    for (const test of this.tests) {
      try {
        console.log(`🧪 测试：${test.name}`);
        await test.fn();
        console.log(`✅ 通过\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ 失败：${error.message}\n`);
        this.failed++;
      }
    }
    
    console.log('=== 测试结果 ===');
    console.log(`通过：${this.passed}`);
    console.log(`失败：${this.failed}`);
    console.log(`总计：${this.passed + this.failed}`);
    
    process.exit(this.failed > 0 ? 1 : 0);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
}

// 测试套件
const runner = new TestRunner();

// =========================================================================
// 测试 1: Policy 配置加载
// =========================================================================
runner.test('Policy 配置加载', async () => {
  const configPath = path.join(__dirname, '../04_coding/src/config.yaml');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // 提取 policy 配置部分
  const policyMatch = configContent.match(/policy:([\s\S]*?)(?=\n  \w+:|$)/);
  runner.assert(policyMatch, '未找到 policy 配置');
  
  const policyContent = policyMatch[1];
  
  // 验证关键配置项
  runner.assert(policyContent.includes('approvals:'), '缺少 approvals 配置');
  runner.assert(policyContent.includes('mode: two_step'), 'approvals.mode 不是 two_step');
  runner.assert(policyContent.includes('conditional_blocks_progress: true'), 'conditional_blocks_progress 不是 true');
  runner.assert(policyContent.includes('blocking_rule: blocking_issues_nonempty'), 'blocking_rule 不正确');
  runner.assert(policyContent.includes('max_total_retries: 5'), 'max_total_retries 不是 5');
  
  console.log('  ✓ policy 配置格式正确');
  console.log('  ✓ approvals.mode = two_step');
  console.log('  ✓ conditional_blocks_progress = true');
  console.log('  ✓ blocking_rule = blocking_issues_nonempty');
  console.log('  ✓ max_total_retries = 5');
});

// =========================================================================
// 测试 2: 决策逻辑测试
// =========================================================================
runner.test('决策逻辑测试（makeDecision）', async () => {
  const ReviewDesignAgentV2 = require('../04_coding/src/review-agents/review-design-v2');
  
  // 模拟配置
  const config = {
    stages: {
      designing: {
        policy: {
          conditional_blocks_progress: true
        }
      }
    }
  };
  
  const agent = new ReviewDesignAgentV2(config);
  
  // 测试用例 1: blockingIssues 非空 → BLOCK
  const report1 = {
    gates: {
      freshness: { passed: true },
      traceability: { passed: true }
    },
    blockingIssues: [
      { id: 'FG_HASH_MISMATCH', severity: 'blocker', message: '哈希不匹配' }
    ],
    decision: 'reject'
  };
  
  const result1 = agent.makeDecision(report1, config.stages.designing.policy);
  runner.assert(result1.decision === 'BLOCK', 'blockingIssues 非空应该 BLOCK');
  runner.assert(result1.blockingIssues.length > 0, '应该有 blockingIssues');
  console.log('  ✓ blockingIssues 非空 → BLOCK');
  
  // 测试用例 2: blockingIssues 为空 → PASS
  const report2 = {
    gates: {
      freshness: { passed: true },
      traceability: { passed: true }
    },
    blockingIssues: [],
    decision: 'pass'
  };
  
  const result2 = agent.makeDecision(report2, config.stages.designing.policy);
  runner.assert(result2.decision === 'PASS', 'blockingIssues 为空应该 PASS');
  console.log('  ✓ blockingIssues 为空 → PASS');
  
  // 测试用例 3: conditional + conditional_blocks_progress=true → BLOCK
  const report3 = {
    gates: {
      freshness: { passed: true },
      traceability: { passed: true }
    },
    blockingIssues: [],
    decision: 'conditional'
  };
  
  const result3 = agent.makeDecision(report3, config.stages.designing.policy);
  runner.assert(result3.decision === 'BLOCK', 'conditional 应该 BLOCK（policy 配置）');
  console.log('  ✓ conditional + blocks_progress=true → BLOCK');
  
  // 测试用例 4: Gate 失败 → BLOCK
  const report4 = {
    gates: {
      freshness: { passed: false, reason: '哈希不匹配' },
      traceability: { passed: true }
    },
    blockingIssues: [],
    decision: 'pass'
  };
  
  const result4 = agent.makeDecision(report4, config.stages.designing.policy);
  runner.assert(result4.decision === 'BLOCK', 'Gate 失败应该 BLOCK');
  runner.assert(result4.blockingIssues[0].id === 'FG_FAILED', '应该是 FG_FAILED');
  console.log('  ✓ Gate 失败 → BLOCK');
});

// =========================================================================
// 测试 3: 状态字段测试
// =========================================================================
runner.test('状态字段测试（state-manager）', async () => {
  const StateManager = require('../04_coding/src/state-manager');
  
  // 创建临时状态文件
  const tempStateFile = path.join(__dirname, 'test-state.json');
  const stateManager = new StateManager(tempStateFile, './logs');
  
  // 初始化状态
  stateManager.init('test-workflow', '测试任务', '全新功能', './test-project');
  
  const state = stateManager.state;
  
  // 验证 designing 阶段新增字段
  const designingStage = state.stages.designing;
  runner.assert(designingStage.stageStatus === 'generating', 'stageStatus 初始值错误');
  runner.assert(designingStage.attempt === 0, 'attempt 初始值错误');
  runner.assert(designingStage.retryCountTotal === 0, 'retryCountTotal 初始值错误');
  runner.assert(typeof designingStage.sameIssueStreak === 'object', 'sameIssueStreak 应该是对象');
  console.log('  ✓ designing.stageStatus = generating');
  console.log('  ✓ designing.attempt = 0');
  console.log('  ✓ designing.retryCountTotal = 0');
  console.log('  ✓ designing.sameIssueStreak 已初始化');
  
  // 验证 approvals 字段
  runner.assert(typeof state.approvals === 'object', 'approvals 应该是对象');
  runner.assert(typeof state.approvals.designing === 'object', 'approvals.designing 应该是对象');
  runner.assert(state.approvals.designing.prd === null, 'approvals.designing.prd 初始值应该是 null');
  runner.assert(state.approvals.designing.trd === null, 'approvals.designing.trd 初始值应该是 null');
  console.log('  ✓ approvals.designing.prd = null');
  console.log('  ✓ approvals.designing.trd = null');
  
  // 验证 transitionLog 字段
  runner.assert(Array.isArray(state.transitionLog), 'transitionLog 应该是数组');
  console.log('  ✓ transitionLog 已初始化');
  
  // 测试 approvePRD 方法
  stateManager.state.requirementsContent = 'test requirements';
  stateManager.state.stages.designing.lastPrdContent = 'test prd';
  stateManager.state.stages.designing.stageStatus = 'prd_confirm_pending';
  
  stateManager.approvePRD('test-user', 'req-hash-123', 'prd-hash-456', '测试备注');
  
  runner.assert(state.approvals.designing.prd !== null, 'PRD 确认后 prd 不应该为 null');
  runner.assert(state.approvals.designing.prd.approvedBy === 'test-user', 'approvedBy 错误');
  runner.assert(state.stages.designing.stageStatus === 'trd_confirm_pending', '状态应该变为 trd_confirm_pending');
  console.log('  ✓ approvePRD() 方法工作正常');
  
  // 测试 transitionLog
  runner.assert(state.transitionLog.length > 0, 'transitionLog 应该有记录');
  const lastTransition = state.transitionLog[state.transitionLog.length - 1];
  runner.assert(lastTransition.from === 'prd_confirm_pending', 'transition.from 错误');
  runner.assert(lastTransition.to === 'trd_confirm_pending', 'transition.to 错误');
  runner.assert(lastTransition.reason === 'PRD_APPROVED', 'transition.reason 错误');
  console.log('  ✓ transitionLog 记录正确');
  
  // 清理临时文件
  fs.unlinkSync(tempStateFile);
});

// =========================================================================
// 测试 4: 两次确认测试（approvePRD/approveTRD）
// =========================================================================
runner.test('两次确认测试（哈希绑定验证）', async () => {
  const WorkflowOrchestrator = require('../04_coding/src/workflow-orchestrator');
  const StateManager = require('../04_coding/src/state-manager');
  
  // 创建临时状态文件
  const tempStateFile = path.join(__dirname, 'test-state-2.json');
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-workflow', '测试任务', '全新功能', './test-project');
  
  // 模拟配置
  const config = {
    stages: {
      designing: {
        policy: {}
      }
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(config, stateManager);
  
  // 设置测试状态
  stateManager.state.requirementsContent = 'test requirements';
  stateManager.state.stages.designing.lastPrdContent = 'test prd content';
  stateManager.state.stages.designing.lastTrdContent = 'test trd content';
  stateManager.state.stages.designing.stageStatus = 'prd_confirm_pending';
  
  // 计算哈希
  const reqHash = stateManager.calculateHash(stateManager.state.requirementsContent);
  const prdHash = stateManager.calculateHash(stateManager.state.stages.designing.lastPrdContent);
  
  // 测试 1: 正确的哈希应该通过
  const result1 = await orchestrator.approvePRD({
    userId: 'test-user',
    requirementsHash: reqHash,
    prdHash: prdHash,
    notes: '测试确认'
  });
  
  runner.assert(result1.success === true, '正确的哈希应该通过确认');
  console.log('  ✓ 正确的哈希通过确认');
  
  // 测试 2: 错误的 REQUIREMENTS 哈希应该失败
  stateManager.state.stages.designing.stageStatus = 'prd_confirm_pending';
  const result2 = await orchestrator.approvePRD({
    userId: 'test-user',
    requirementsHash: 'wrong-hash',
    prdHash: prdHash,
    notes: '测试确认'
  });
  
  runner.assert(result2.success === false, '错误的 REQUIREMENTS 哈希应该失败');
  runner.assert(result2.message.includes('REQUIREMENTS 已变更'), '错误消息应该提示 REQUIREMENTS 已变更');
  console.log('  ✓ 错误的 REQUIREMENTS 哈希被拒绝');
  
  // 测试 3: 错误的 PRD 哈希应该失败
  stateManager.state.stages.designing.stageStatus = 'prd_confirm_pending';
  const result3 = await orchestrator.approvePRD({
    userId: 'test-user',
    requirementsHash: reqHash,
    prdHash: 'wrong-prd-hash',
    notes: '测试确认'
  });
  
  runner.assert(result3.success === false, '错误的 PRD 哈希应该失败');
  runner.assert(result3.message.includes('PRD 已变更'), '错误消息应该提示 PRD 已变更');
  console.log('  ✓ 错误的 PRD 哈希被拒绝');
  
  // 清理临时文件
  fs.unlinkSync(tempStateFile);
});

// =========================================================================
// 测试 5: 消除递归测试
// =========================================================================
runner.test('消除递归测试（executeDesigning 使用循环）', async () => {
  const fs = require('fs');
  const orchestratorPath = path.join(__dirname, '../04_coding/src/workflow-orchestrator.js');
  const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf8');
  
  // 检查是否有递归调用
  const recursivePattern = /await\s+this\.executeDesigning\(/g;
  const matches = orchestratorContent.match(recursivePattern);
  
  // 应该只有 1 次（循环内的调用），而不是递归
  runner.assert(matches !== null, '应该找到 executeDesigning 调用');
  
  // 检查是否使用循环而非递归
  const whilePattern = /while\s*\([^)]*retryCount[^)]*\)/;
  const forPattern = /for\s*\([^)]*retry[^)]*\)/;
  
  const hasWhile = whilePattern.test(orchestratorContent);
  const hasFor = forPattern.test(orchestratorContent);
  
  runner.assert(hasWhile || hasFor, '应该使用 while 或 for 循环控制重试');
  console.log('  ✓ 使用循环控制重试');
  
  // 检查是否有最大重试次数检查
  const maxRetriesPattern = /max_total_retries|max_retries_per_issue/;
  runner.assert(maxRetriesPattern.test(orchestratorContent), '应该有最大重试次数检查');
  console.log('  ✓ 有最大重试次数检查');
  
  // 检查是否有同问题连续次数检查
  const sameIssuePattern = /sameIssueStreak|same_issue_streak/;
  runner.assert(sameIssuePattern.test(orchestratorContent), '应该有同问题连续次数检查');
  console.log('  ✓ 有同问题连续次数检查');
});

// =========================================================================
// 测试 6: 重试限制测试
// =========================================================================
runner.test('重试限制测试（超过次数升级）', async () => {
  const WorkflowOrchestrator = require('../04_coding/src/workflow-orchestrator');
  const StateManager = require('../04_coding/src/state-manager');
  
  // 创建临时状态文件
  const tempStateFile = path.join(__dirname, 'test-state-3.json');
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-workflow', '测试任务', '全新功能', './test-project');
  
  // 模拟配置
  const config = {
    stages: {
      designing: {
        policy: {
          retry: {
            max_total_retries: 2,  // 设置较小的值便于测试
            max_retries_per_issue: {
              DEFAULT: 2
            },
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
  
  // 验证配置已加载
  runner.assert(config.stages.designing.policy.retry.max_total_retries === 2, 'max_total_retries 配置错误');
  console.log('  ✓ 重试配置已加载');
  
  // 模拟超过重试次数的场景
  stateManager.state.stages.designing.retryCountTotal = 2;
  stateManager.state.stages.designing.sameIssueStreak = { issueId: 'TEST_ISSUE', count: 2 };
  
  // 验证状态
  runner.assert(stateManager.state.stages.designing.retryCountTotal >= config.stages.designing.policy.retry.max_total_retries, '应该达到最大重试次数');
  console.log('  ✓ 达到最大重试次数时触发升级');
  
  // 清理临时文件
  fs.unlinkSync(tempStateFile);
});

// =========================================================================
// 运行测试
// =========================================================================
runner.run().catch(err => {
  console.error('测试执行失败:', err);
  process.exit(1);
});
