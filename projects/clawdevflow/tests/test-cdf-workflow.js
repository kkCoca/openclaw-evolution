#!/usr/bin/env node

/**
 * CDF Workflow Orchestrator 测试脚本
 */

const path = require('path');
const WorkflowOrchestrator = require('./cdf-orchestrator/workflow-orchestrator');
const StateManager = require('./cdf-orchestrator/state-manager');

// 测试配置
const config = {
  workspaceRoot: '/home/ouyp/Learning/Practice/openclaw-universe',
  reviewer: 'openclaw-ouyp'
};

// 测试项目路径
const testProjectPath = path.join(__dirname, 'test-cdf-project');

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ClawDevFlow Workflow Orchestrator 测试                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // 测试 1: WorkflowOrchestrator 实例化
  console.log('📋 测试 1: WorkflowOrchestrator 实例化检查');
  try {
    const orchestrator = new WorkflowOrchestrator(config);
    console.log('✅ 通过：WorkflowOrchestrator 能正常实例化');
    passed++;
  } catch (error) {
    console.log('❌ 失败：WorkflowOrchestrator 实例化失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 2: StateManager 状态管理
  console.log('📋 测试 2: StateManager 状态管理检查');
  try {
    const fs = require('fs');
    const StageStatus = require('./cdf-orchestrator/state-manager').StageStatus;
    
    // 确保测试目录存在
    if (!fs.existsSync(testProjectPath)) {
      fs.mkdirSync(testProjectPath, { recursive: true });
    }

    const stateManager = new StateManager(config, testProjectPath);
    
    // 检查工作流 ID 是否生成
    if (stateManager.state && stateManager.state.workflowId) {
      console.log(`✅ 通过：工作流 ID 已生成 (${stateManager.state.workflowId})`);
      passed++;
    } else {
      console.log('❌ 失败：工作流 ID 未生成');
      failed++;
    }

    // 测试阶段状态更新
    stateManager.updateStage('designing', StageStatus.RUNNING);
    const stage = stateManager.getStage('designing');
    
    if (stage && stage.status === 'running') {
      console.log('✅ 通过：阶段状态更新正确');
      passed++;
    } else {
      console.log('❌ 失败：阶段状态更新错误');
      failed++;
    }

    // 测试审阅决策记录
    stateManager.recordReviewDecision('designing', 'pass', '整体质量良好', []);
    const updatedStage = stateManager.getStage('designing');
    
    if (updatedStage && updatedStage.reviewDecision === 'pass' && updatedStage.status === 'passed') {
      console.log('✅ 通过：审阅决策记录正确');
      passed++;
    } else {
      console.log('❌ 失败：审阅决策记录错误');
      failed++;
    }

    // 测试状态报告
    const report = stateManager.getReport();
    
    if (report && report.workflowId && report.progress) {
      console.log(`✅ 通过：状态报告生成正确 (进度：${report.progress.percentage}%)`);
      passed++;
    } else {
      console.log('❌ 失败：状态报告生成错误');
      failed++;
    }

  } catch (error) {
    console.log('❌ 失败：StateManager 测试失败:', error.message);
    console.log('   错误堆栈:', error.stack);
    failed += 4;
  }
  console.log('');

  // 测试 3: StageExecutor 阶段执行
  console.log('📋 测试 3: StageExecutor 阶段执行检查');
  try {
    const StageExecutor = require('./cdf-orchestrator/stage-executor');
    const executor = new StageExecutor(config);

    // 测试 Designing 阶段执行
    const result = await executor.execute('designing', {}, testProjectPath);
    
    if (result.success && result.outputs.length > 0) {
      console.log('✅ 通过：Designing 阶段执行成功');
      console.log(`   产出：${result.outputs.length} 个文件`);
      passed++;
    } else {
      console.log('❌ 失败：Designing 阶段执行失败');
      failed++;
    }

  } catch (error) {
    console.log('❌ 失败：StageExecutor 测试失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 4: 完整工作流（模拟）
  console.log('📋 测试 4: 完整工作流模拟检查');
  try {
    const orchestrator = new WorkflowOrchestrator(config);
    
    // 检查工作流配置
    if (typeof orchestrator.execute === 'function' &&
        typeof orchestrator.resume === 'function') {
      console.log('✅ 通过：WorkflowOrchestrator 有必需的方法');
      passed++;
    } else {
      console.log('❌ 失败：WorkflowOrchestrator 缺少必需的方法');
      failed++;
    }

    // 检查阶段序列
    const expectedStages = ['designing', 'roadmapping', 'detailing', 'coding', 'testing', 'reviewing'];
    const STAGE_SEQUENCE = require('./cdf-orchestrator/stage-executor').Stage;
    const stages = [
      STAGE_SEQUENCE.DESIGNING,
      STAGE_SEQUENCE.ROADMAPPING,
      STAGE_SEQUENCE.DETAILING,
      STAGE_SEQUENCE.CODING,
      STAGE_SEQUENCE.TESTING,
      STAGE_SEQUENCE.REVIEWING
    ];

    if (stages.length === 6 && stages.every(s => expectedStages.includes(s))) {
      console.log('✅ 通过：阶段序列正确 (6 个阶段)');
      passed++;
    } else {
      console.log('❌ 失败：阶段序列错误');
      failed++;
    }

  } catch (error) {
    console.log('❌ 失败：工作流模拟测试失败:', error.message);
    failed += 2;
  }
  console.log('');

  // 测试结果汇总
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    测试结果汇总                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`总测试数：${passed + failed}`);
  console.log(`✅ 通过：${passed}`);
  console.log(`❌ 失败：${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 所有测试通过！CDF Workflow Orchestrator 工作正常。');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('CDF 核心流程实施完成！');
    console.log('已创建文件:');
    console.log('  - cdf-orchestrator/stage-executor.js');
    console.log('  - cdf-orchestrator/state-manager.js');
    console.log('  - cdf-orchestrator/workflow-orchestrator.js');
    console.log('  - test-cdf-workflow.js');
    console.log('═══════════════════════════════════════════════════════════');
    return 0;
  } else {
    console.log('⚠️  有测试失败，请检查错误信息。');
    return 1;
  }
}

// 运行测试
runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
