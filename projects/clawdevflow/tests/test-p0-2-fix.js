#!/usr/bin/env node

/**
 * P0-2 修复验证测试（v3.4.0-alpha9）
 * 
 * 测试内容：
 * 断点恢复时 designing 不重复生成覆盖
 * - prd_confirm_pending 状态下跳过生成
 * - trd_confirm_pending 状态下跳过生成
 * - passed 状态下返回 completed=true
 * - blocked 状态下返回 BLOCKED
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
    console.log('=== P0-2 修复验证测试 ===\n');
    
    await this.test('测试 1: prd_confirm_pending 状态下跳过生成', testPrdConfirmPending);
    await this.test('测试 2: trd_confirm_pending 状态下跳过生成', testTrdConfirmPending);
    await this.test('测试 3: passed 状态下返回 completed=true', testPassed);
    await this.test('测试 4: blocked 状态下返回 BLOCKED', testBlocked);
    
    console.log('=== 测试结果 ===');
    console.log(`通过：${this.passed}`);
    console.log(`失败：${this.failed}`);
    console.log(`总计：${this.passed + this.failed}`);
    
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// =========================================================================
// 测试 1: prd_confirm_pending 状态下跳过生成
// =========================================================================
async function testPrdConfirmPending() {
  console.log('步骤 1: 初始化状态和配置');
  
  const tempStateFile = '/tmp/test-p0-2-prd-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p0-2-prd', '测试任务', '全新功能', './test-project');
  
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
  
  console.log('步骤 2: 设置 stageStatus=prd_confirm_pending');
  stateManager.state.stages.designing.stageStatus = 'prd_confirm_pending';
  stateManager.save();
  
  console.log('步骤 3: 调用 executeDesigning()');
  const result = await orchestrator.executeDesigning({ projectPath: './test-project' });
  
  console.log('  返回结果:', result);
  
  // 验证
  assert(result.success === false, '应该返回 success=false');
  assert(result.reason === 'WAITING_CONFIRMATION', '应该返回 WAITING_CONFIRMATION');
  assert(result.stageStatus === 'prd_confirm_pending', 'stageStatus 应该正确');
  
  console.log('  ✓ prd_confirm_pending 状态下跳过生成');
  console.log('  ✓ 返回 WAITING_CONFIRMATION');
  
  // 清理
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 1 通过：pr d_confirm_pending 状态下跳过生成');
}

// =========================================================================
// 测试 2: trd_confirm_pending 状态下跳过生成
// =========================================================================
async function testTrdConfirmPending() {
  console.log('步骤 1: 初始化状态和配置');
  
  const tempStateFile = '/tmp/test-p0-2-trd-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p0-2-trd', '测试任务', '全新功能', './test-project');
  
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
  stateManager.save();
  
  console.log('步骤 3: 调用 executeDesigning()');
  const result = await orchestrator.executeDesigning({ projectPath: './test-project' });
  
  console.log('  返回结果:', result);
  
  // 验证
  assert(result.success === false, '应该返回 success=false');
  assert(result.reason === 'WAITING_CONFIRMATION', '应该返回 WAITING_CONFIRMATION');
  assert(result.stageStatus === 'trd_confirm_pending', 'stageStatus 应该正确');
  
  console.log('  ✓ trd_confirm_pending 状态下跳过生成');
  console.log('  ✓ 返回 WAITING_CONFIRMATION');
  
  // 清理
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 2 通过：trd_confirm_pending 状态下跳过生成');
}

// =========================================================================
// 测试 3: passed 状态下返回 completed=true
// =========================================================================
async function testPassed() {
  console.log('步骤 1: 初始化状态和配置');
  
  const tempStateFile = '/tmp/test-p0-2-passed-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p0-2-passed', '测试任务', '全新功能', './test-project');
  
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
  
  console.log('步骤 2: 设置 stageStatus=passed');
  stateManager.state.stages.designing.stageStatus = 'passed';
  stateManager.save();
  
  console.log('步骤 3: 调用 executeDesigning()');
  const result = await orchestrator.executeDesigning({ projectPath: './test-project' });
  
  console.log('  返回结果:', result);
  
  // 验证
  assert(result.success === true, '应该返回 success=true');
  assert(result.completed === true, '应该返回 completed=true');
  assert(result.stageStatus === 'passed', 'stageStatus 应该正确');
  
  console.log('  ✓ passed 状态下返回 completed=true');
  console.log('  ✓ 跳过生成');
  
  // 清理
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 3 通过：passed 状态下返回 completed=true');
}

// =========================================================================
// 测试 4: blocked 状态下返回 BLOCKED
// =========================================================================
async function testBlocked() {
  console.log('步骤 1: 初始化状态和配置');
  
  const tempStateFile = '/tmp/test-p0-2-blocked-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p0-2-blocked', '测试任务', '全新功能', './test-project');
  
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
  
  console.log('步骤 2: 设置 stageStatus=blocked');
  stateManager.state.stages.designing.stageStatus = 'blocked';
  stateManager.save();
  
  console.log('步骤 3: 调用 executeDesigning()');
  const result = await orchestrator.executeDesigning({ projectPath: './test-project' });
  
  console.log('  返回结果:', result);
  
  // 验证
  assert(result.success === false, '应该返回 success=false');
  assert(result.reason === 'BLOCKED', '应该返回 BLOCKED');
  assert(result.stageStatus === 'blocked', 'stageStatus 应该正确');
  
  console.log('  ✓ blocked 状态下返回 BLOCKED');
  console.log('  ✓ 跳过生成');
  
  // 清理
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 4 通过：blocked 状态下返回 BLOCKED');
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
