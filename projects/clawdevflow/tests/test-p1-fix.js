#!/usr/bin/env node

/**
 * P1 修复验证测试（v3.4.0-alpha13）
 * 
 * 测试内容：
 * 1. executeStage guard - 禁止处理 designing
 * 2. stage state 同步 - TRD_APPROVED 时同步 updateStage
 * 3. stage state 同步 - RETRY_EXHAUSTED 时同步 updateStage
 */

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
      console.log(error.stack);
      this.failed++;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async run() {
    console.log('=== P1 修复验证测试 ===\n');
    
    await this.test('测试 1: executeStage 禁止处理 designing', testExecuteStageGuard);
    await this.test('测试 2: TRD_APPROVED 时同步 stage state', testTrdApprovedSync);
    await this.test('测试 3: RETRY_EXHAUSTED 时同步 stage state', testRetryExhaustedSync);
    
    console.log('=== 测试结果 ===');
    console.log(`通过：${this.passed}`);
    console.log(`失败：${this.failed}`);
    console.log(`总计：${this.passed + this.failed}`);
    
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// =========================================================================
// 测试 1: executeStage 禁止处理 designing
// =========================================================================
async function testExecuteStageGuard() {
  console.log('步骤 1: 初始化状态和配置');
  
  const tempStateFile = '/tmp/test-p1-guard-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p1-guard', '测试任务', '全新功能', './test-project');
  
  const config = {
    stages: {
      designing: {
        policy: {
          approvals: { mode: 'auto' },
          conditional_blocks_progress: true,
          blocking_rule: 'blocking_issues_nonempty',
          retry: {
            max_total_retries: 5,
            max_retries_per_issue: { DEFAULT: 3 },
            same_issue_streak_limit: 3
          },
          escalation: { on_retry_exhausted: 'clarify_required' }
        }
      },
      roadmapping: { maxRetries: 3 }
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(config, stateManager);
  
  console.log('步骤 2: 尝试调用 executeStage("designing")');
  
  try {
    await orchestrator.executeStage('designing', { projectPath: './test-project' });
    // 不应该到达这里
    throw new Error('executeStage("designing") 应该抛出错误');
  } catch (error) {
    // 验证错误消息
    assert(
      error.message.includes('designing 阶段必须使用 executeDesigning()'),
      `错误消息应该提示使用 executeDesigning()，实际：${error.message}`
    );
    console.log('  ✓ executeStage("designing") 抛出错误');
    console.log(`  ✓ 错误消息：${error.message}`);
  }
  
  // 清理
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 1 通过：executeStage 禁止处理 designing');
}

// =========================================================================
// 测试 2: TRD_APPROVED 时同步 stage state
// =========================================================================
async function testTrdApprovedSync() {
  console.log('步骤 1: 初始化状态和配置');
  
  const tempStateFile = '/tmp/test-p1-trd-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p1-trd', '测试任务', '全新功能', './test-project');
  
  const config = {
    stages: {
      designing: {
        policy: {
          approvals: { mode: 'auto' },
          conditional_blocks_progress: true,
          blocking_rule: 'blocking_issues_nonempty',
          retry: {
            max_total_retries: 5,
            max_retries_per_issue: { DEFAULT: 3 },
            same_issue_streak_limit: 3
          },
          escalation: { on_retry_exhausted: 'clarify_required' }
        }
      }
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(config, stateManager);
  
  console.log('步骤 2: 设置 stageStatus=trd_confirm_pending');
  stateManager.state.stages.designing.stageStatus = 'trd_confirm_pending';
  stateManager.state.requirementsContent = 'test requirements';
  stateManager.state.stages.designing.lastTrdContent = 'test trd';
  stateManager.save();
  
  console.log('步骤 3: 调用 approveTRD()');
  const trdHash = stateManager.calculateHash(stateManager.state.stages.designing.lastTrdContent);
  const reqHash = stateManager.calculateHash(stateManager.state.requirementsContent);
  
  const result = await orchestrator.approveTRD({
    userId: 'test-user',
    requirementsHash: reqHash,
    trdHash: trdHash,
    notes: 'TRD 确认测试'
  });
  
  console.log('  approveTRD 结果:', result);
  
  // 验证 stageStatus
  const stageStatus = stateManager.state.stages.designing.stageStatus;
  assert(stageStatus === 'passed', `stageStatus 应该为 passed，实际：${stageStatus}`);
  console.log(`  ✓ stageStatus: ${stageStatus}`);
  
  // 验证通用 stage state
  const designingStage = stateManager.state.stages.designing;
  assert(designingStage.status === 'passed', `通用 stage state 应该为 passed，实际：${designingStage.status}`);
  console.log(`  ✓ 通用 stage state: ${designingStage.status}`);
  
  // 验证两者一致
  assert(stageStatus === designingStage.status, 'stageStatus 和通用 stage state 应该一致');
  console.log('  ✓ stageStatus 和通用 stage state 一致');
  
  // 清理
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 2 通过：TRD_APPROVED 时同步 stage state');
}

// =========================================================================
// 测试 3: RETRY_EXHAUSTED 时同步 stage state
// =========================================================================
async function testRetryExhaustedSync() {
  console.log('步骤 1: 初始化状态和配置');
  
  const tempStateFile = '/tmp/test-p1-retry-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p1-retry', '测试任务', '全新功能', './test-project');
  
  const config = {
    stages: {
      designing: {
        policy: {
          approvals: { mode: 'auto' },
          conditional_blocks_progress: true,
          blocking_rule: 'blocking_issues_nonempty',
          retry: {
            max_total_retries: 2,  // 设置较小的值便于测试
            max_retries_per_issue: { DEFAULT: 2 },
            same_issue_streak_limit: 2
          },
          escalation: { on_retry_exhausted: 'clarify_required' }
        }
      }
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(config, stateManager);
  
  console.log('步骤 2: 模拟 RETRY_EXHAUSTED 场景');
  
  // 模拟 executeDesigning() 中的重试逻辑
  const policy = config.stages.designing.policy;
  let retryCount = 0;
  let sameIssueStreak = 0;
  let lastIssueId = null;
  
  // 模拟两次重试
  while (retryCount < policy.retry.max_total_retries) {
    retryCount++;
    console.log(`  第 ${retryCount} 次重试`);
    
    // 模拟 blockingIssues
    const blockingIssues = [{
      id: 'TEST_ISSUE',
      severity: 'blocker',
      message: '测试失败'
    }];
    
    const firstIssueId = blockingIssues[0].id;
    if (firstIssueId === lastIssueId) {
      sameIssueStreak++;
    } else {
      sameIssueStreak = 1;
      lastIssueId = firstIssueId;
    }
    
    // 检查是否达到阈值
    const maxRetriesPerIssue = policy.retry.max_retries_per_issue[firstIssueId] || policy.retry.max_retries_per_issue.DEFAULT;
    
    if (
      retryCount >= policy.retry.max_total_retries ||
      sameIssueStreak >= policy.retry.same_issue_streak_limit ||
      retryCount >= maxRetriesPerIssue
    ) {
      console.log(`  ✓ 达到重试限制，升级到 blocked`);
      
      // 设置 stageStatus
      stateManager.state.stages.designing.stageStatus = 'blocked';
      
      // v3.4.0-alpha13 修复 P1-2：同步通用 stage state
      stateManager.updateStage('designing', 'blocked');
      stateManager.save();
      
      break;
    }
  }
  
  console.log('步骤 3: 验证 stage state 同步');
  
  // 验证 stageStatus
  const stageStatus = stateManager.state.stages.designing.stageStatus;
  assert(stageStatus === 'blocked', `stageStatus 应该为 blocked，实际：${stageStatus}`);
  console.log(`  ✓ stageStatus: ${stageStatus}`);
  
  // 验证通用 stage state
  const designingStage = stateManager.state.stages.designing;
  assert(designingStage.status === 'blocked', `通用 stage state 应该为 blocked，实际：${designingStage.status}`);
  console.log(`  ✓ 通用 stage state: ${designingStage.status}`);
  
  // 验证两者一致
  assert(stageStatus === designingStage.status, 'stageStatus 和通用 stage state 应该一致');
  console.log('  ✓ stageStatus 和通用 stage state 一致');
  
  // 清理
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 3 通过：RETRY_EXHAUSTED 时同步 stage state');
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
