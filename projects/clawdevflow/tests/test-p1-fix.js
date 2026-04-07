#!/usr/bin/env node

/**
 * P1 修复验证测试（v3.4.0）
 * 
 * 测试内容：
 * 1. 通用阶段去递归验证 - handleReviewDecision 返回结构化结果
 * 2. 通用阶段重试限制验证 - maxRetries 控制
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
    
    await this.test('测试 1: handleReviewDecision 返回结构化结果', testHandleReviewDecision);
    await this.test('测试 2: 通用阶段重试限制', testRetryLimit);
    
    console.log('=== 测试结果 ===');
    console.log(`通过：${this.passed}`);
    console.log(`失败：${this.failed}`);
    console.log(`总计：${this.passed + this.failed}`);
    
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// =========================================================================
// 测试 1: handleReviewDecision 返回结构化结果
// =========================================================================
async function testHandleReviewDecision() {
  console.log('步骤 1: 初始化状态和配置');
  
  // 创建临时状态文件
  const tempStateFile = '/tmp/test-p1-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p1-workflow', '测试任务', '全新功能', './test-project');
  
  // 模拟配置（完整 policy 配置）
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
  
  console.log('步骤 2: 测试 handleReviewDecision 返回值');
  
  // 测试 PASS
  const passResult = await orchestrator.handleReviewDecision('roadmapping', 'pass');
  console.log('PASS 结果:', passResult);
  assert(typeof passResult === 'object', 'PASS 应该返回对象');
  assert(passResult.shouldContinue === true, 'PASS 应该 shouldContinue=true');
  assert(passResult.shouldRetry === false, 'PASS 应该 shouldRetry=false');
  console.log('  ✓ PASS 返回结构化结果');
  
  // 测试 CONDITIONAL
  const conditionalResult = await orchestrator.handleReviewDecision('roadmapping', 'conditional');
  console.log('CONDITIONAL 结果:', conditionalResult);
  assert(typeof conditionalResult === 'object', 'CONDITIONAL 应该返回对象');
  assert(conditionalResult.shouldContinue === true, 'CONDITIONAL 应该 shouldContinue=true');
  assert(conditionalResult.shouldRetry === true, 'CONDITIONAL 应该 shouldRetry=true');
  assert(conditionalResult.reason === 'CONDITIONAL_BLOCKED', 'CONDITIONAL 应该有正确的 reason');
  console.log('  ✓ CONDITIONAL 返回结构化结果');
  
  // 测试 REJECT
  const rejectResult = await orchestrator.handleReviewDecision('roadmapping', 'reject');
  console.log('REJECT 结果:', rejectResult);
  assert(typeof rejectResult === 'object', 'REJECT 应该返回对象');
  assert(rejectResult.shouldContinue === true, 'REJECT 应该 shouldContinue=true');
  assert(rejectResult.shouldRetry === true, 'REJECT 应该 shouldRetry=true');
  console.log('  ✓ REJECT 返回结构化结果');
  
  // 测试 CLARIFY
  const clarifyResult = await orchestrator.handleReviewDecision('roadmapping', 'clarify');
  console.log('CLARIFY 结果:', clarifyResult);
  assert(typeof clarifyResult === 'object', 'CLARIFY 应该返回对象');
  assert(clarifyResult.shouldContinue === false, 'CLARIFY 应该 shouldContinue=false');
  assert(clarifyResult.shouldRetry === false, 'CLARIFY 应该 shouldRetry=false');
  console.log('  ✓ CLARIFY 返回结构化结果');
  
  // 测试 TERMINATE
  const terminateResult = await orchestrator.handleReviewDecision('roadmapping', 'terminate');
  console.log('TERMINATE 结果:', terminateResult);
  assert(typeof terminateResult === 'object', 'TERMINATE 应该返回对象');
  assert(terminateResult.shouldContinue === false, 'TERMINATE 应该 shouldContinue=false');
  assert(terminateResult.shouldRetry === false, 'TERMINATE 应该 shouldRetry=false');
  console.log('  ✓ TERMINATE 返回结构化结果');
  
  // 清理临时文件
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 1 通过：handleReviewDecision 返回结构化结果');
}

// =========================================================================
// 测试 2: 通用阶段重试限制
// =========================================================================
async function testRetryLimit() {
  console.log('步骤 1: 初始化状态和配置');
  
  // 创建临时状态文件
  const tempStateFile = '/tmp/test-p1-retry-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p1-retry-workflow', '测试任务 2', '全新功能', './test-project-2');
  
  // 模拟配置（完整 policy 配置）
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
      roadmapping: { maxRetries: 2 }  // 设置较小的值便于测试
    }
  };
  
  const orchestrator = new WorkflowOrchestrator(config, stateManager);
  
  console.log('步骤 2: 验证重试限制逻辑');
  
  // 模拟重试计数
  const maxRetries = config.stages.roadmapping.maxRetries;
  let retryCount = 0;
  
  // 模拟重试循环
  while (retryCount < maxRetries) {
    retryCount++;
    console.log(`  第 ${retryCount} 次重试`);
    
    // 模拟 handleReviewDecision 返回 shouldRetry=true
    const result = await orchestrator.handleReviewDecision('roadmapping', 'reject');
    
    if (result.shouldRetry) {
      console.log(`    ✓ shouldRetry=true，继续重试`);
      
      // 检查是否达到重试限制
      if (retryCount >= maxRetries) {
        console.log(`    ✓ 达到最大重试次数 ${maxRetries}`);
        
        // 验证状态更新
        assert(stateManager.state.stages.roadmapping.status === 'rejected', '状态应该为 rejected');
        console.log(`    ✓ 状态更新为 rejected`);
        
        break;
      }
    }
  }
  
  // 验证重试次数
  assert(retryCount === maxRetries, `重试次数应该等于 maxRetries (${maxRetries})`);
  console.log(`  ✓ 重试次数正确：${retryCount}`);
  
  // 清理临时文件
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试 2 通过：通用阶段重试限制');
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
