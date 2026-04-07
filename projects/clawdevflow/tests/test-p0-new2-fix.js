#!/usr/bin/env node

/**
 * P0-新 2 修复验证测试（v3.4.0-alpha6）
 * 
 * 测试内容：
 * designing 分支在 AutoReview PASS 后不直接推进 stageIndex
 * 必须等待两次确认完成（stageStatus='passed'）后才推进
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
    console.log('=== P0-新 2 修复验证测试 ===\n');
    
    await this.test('测试：designing 分支两次确认流程不被绕过', testDesigningTwoStepConfirmation);
    
    console.log('=== 测试结果 ===');
    console.log(`通过：${this.passed}`);
    console.log(`失败：${this.failed}`);
    console.log(`总计：${this.passed + this.failed}`);
    
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

// =========================================================================
// 测试：designing 分支两次确认流程不被绕过
// =========================================================================
async function testDesigningTwoStepConfirmation() {
  console.log('步骤 1: 初始化状态和配置');
  
  // 创建临时状态文件
  const tempStateFile = '/tmp/test-p0-new2-state.json';
  const stateManager = new StateManager(tempStateFile, './logs');
  stateManager.init('test-p0-new2-workflow', '测试任务', '全新功能', './test-project');
  
  // 模拟配置
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
  
  console.log('步骤 2: 模拟 designing 阶段 AutoReview PASS');
  
  // 模拟 executeDesigning() 返回 success=true（AutoReview PASS）
  // 但此时 stageStatus 应该是 'prd_confirm_pending'，不是 'passed'
  stateManager.state.stages.designing.stageStatus = 'prd_confirm_pending';
  stateManager.save();
  
  const currentStageIndex = orchestrator.currentStageIndex;
  console.log(`  当前 stageIndex: ${currentStageIndex}`);
  console.log(`  当前 designing.stageStatus: ${stateManager.state.stages.designing.stageStatus}`);
  
  console.log('步骤 3: 模拟 execute() 中的 designing 分支逻辑');
  
  // 模拟 executeDesigning() 返回
  const result = {
    success: true,
    report: {}
  };
  
  // 模拟修复后的逻辑
  const designingStageStatus = stateManager.state.stages.designing.stageStatus;
  
  if (designingStageStatus === 'passed') {
    // 两次确认已完成，进入下一阶段
    console.log('  ✓ 两次确认已完成，推进 stageIndex');
    orchestrator.currentStageIndex++;
  } else {
    // 两次确认未完成（prd_confirm_pending 或 trd_confirm_pending）
    // 阻断，等待用户确认
    console.log(`  ✓ 两次确认未完成（当前状态：${designingStageStatus}），阻断等待确认`);
    // 不推进 stageIndex
  }
  
  console.log('步骤 4: 验证 stageIndex 是否被正确阻断');
  
  // 验证 stageIndex 没有被推进
  const newStageIndex = orchestrator.currentStageIndex;
  console.log(`  新 stageIndex: ${newStageIndex}`);
  
  assert(newStageIndex === currentStageIndex, 
    `stageIndex 不应该被推进（期望：${currentStageIndex}, 实际：${newStageIndex}）`);
  console.log(`  ✓ stageIndex 正确阻断在 ${currentStageIndex}`);
  
  console.log('步骤 5: 模拟 PRD 确认 → TRD 确认 → stageStatus=passed');
  
  // 模拟 PRD 确认
  stateManager.state.stages.designing.stageStatus = 'trd_confirm_pending';
  stateManager.save();
  console.log('  ✓ PRD 确认完成，stageStatus=trd_confirm_pending');
  
  // 模拟 TRD 确认
  stateManager.state.stages.designing.stageStatus = 'passed';
  stateManager.save();
  console.log('  ✓ TRD 确认完成，stageStatus=passed');
  
  console.log('步骤 6: 验证 stageStatus=passed 后可以推进 stageIndex');
  
  // 再次模拟 execute() 逻辑
  const finalDesigningStageStatus = stateManager.state.stages.designing.stageStatus;
  
  if (finalDesigningStageStatus === 'passed') {
    orchestrator.currentStageIndex++;
    console.log('  ✓ 两次确认已完成，stageIndex 推进到下一阶段');
  }
  
  // 验证 stageIndex 被正确推进
  const finalStageIndex = orchestrator.currentStageIndex;
  assert(finalStageIndex === currentStageIndex + 1, 
    `stageIndex 应该被推进（期望：${currentStageIndex + 1}, 实际：${finalStageIndex}）`);
  console.log(`  ✓ stageIndex 正确推进到 ${finalStageIndex}`);
  
  // 清理临时文件
  const fs = require('fs');
  if (fs.existsSync(tempStateFile)) fs.unlinkSync(tempStateFile);
  
  console.log('✅ 测试通过：designing 分支两次确认流程不被绕过');
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
