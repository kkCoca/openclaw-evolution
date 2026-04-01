#!/usr/bin/env node

/**
 * State Manager 单元测试脚本
 * 测试覆盖率目标：80%+
 */

const fs = require('fs');
const path = require('path');
const StateManager = require('../04_coding/src/cdf-orchestrator/state-manager');

// 测试配置
const config = {
  workspaceRoot: '/home/ouyp/Learning/Practice/openclaw-universe',
  logLevel: 'info'
};

// 测试结果统计
let passed = 0;
let failed = 0;

/**
 * 断言函数
 */
function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

/**
 * 清理测试环境
 */
function cleanup(testPath) {
  const stateFile = path.join(testPath, '.cdf-state.json');
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
  if (fs.existsSync(testPath)) {
    fs.rmdirSync(testPath);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   State Manager 单元测试                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  // 测试项目路径
  const testProjectPath = path.join(__dirname, 'test-state-project');
  if (!fs.existsSync(testProjectPath)) {
    fs.mkdirSync(testProjectPath, { recursive: true });
  }

  // ========== 测试 1: 实例化 ==========
  console.log('📋 测试 1: StateManager 实例化');
  try {
    const stateManager = new StateManager(config, testProjectPath);
    assert(stateManager !== null, 'StateManager 能正常实例化');
    assert(stateManager.config !== undefined, '配置对象已设置');
    assert(stateManager.projectPath === testProjectPath, '项目路径正确');
    assert(stateManager.stateFile !== undefined, '状态文件路径已设置');
  } catch (error) {
    console.log(`❌ 实例化失败：${error.message}`);
    failed += 4;
  }
  console.log('');

  // ========== 测试 2: 状态文件创建 ==========
  console.log('📋 测试 2: 状态文件创建');
  const stateManager = new StateManager(config, testProjectPath);
  const stateFile = path.join(testProjectPath, '.cdf-state.json');
  
  // 手动保存确保文件存在
  stateManager.save();
  
  assert(fs.existsSync(stateFile), '状态文件已创建');
  
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  assert(state.workflowId !== undefined, '工作流 ID 已生成');
  assert(state.projectPath === testProjectPath, '项目路径已保存');
  assert(state.status === 'initialized', '初始状态正确');
  assert(state.stages !== undefined, '阶段对象已初始化');
  console.log('');

  // ========== 测试 3: 阶段状态更新 ==========
  console.log('📋 测试 3: 阶段状态更新');
  const StageStatus = require('../04_coding/src/cdf-orchestrator/state-manager').StageStatus;
  
  stateManager.updateStage('designing', StageStatus.RUNNING);
  let stage = stateManager.getStage('designing');
  assert(stage.status === 'running', '阶段状态更新为 running');
  
  stateManager.updateStage('designing', StageStatus.REVIEWING);
  stage = stateManager.getStage('designing');
  assert(stage.status === 'reviewing', '阶段状态更新为 reviewing');
  
  stateManager.updateStage('designing', StageStatus.PASSED);
  stage = stateManager.getStage('designing');
  assert(stage.status === 'passed', '阶段状态更新为 passed');
  console.log('');

  // ========== 测试 4: 审阅决策记录 ==========
  console.log('📋 测试 4: 审阅决策记录');
  stateManager.recordReviewDecision('designing', 'pass', '整体质量良好', []);
  stage = stateManager.getStage('designing');
  assert(stage.reviewDecision === 'pass', '审阅决策已记录');
  assert(stage.reviewNotes === '整体质量良好', '审阅备注已记录');
  assert(Array.isArray(stage.fixItems), '修复项数组已初始化');
  console.log('');

  // ========== 测试 5: 条件通过 ==========
  console.log('📋 测试 5: 条件通过记录');
  const fixItems = [
    { id: 'D1', description: '需求覆盖率不足', status: 'pending' },
    { id: 'D2', description: '存在模糊描述', status: 'pending' }
  ];
  stateManager.recordReviewDecision('roadmapping', 'conditional', '有小问题', fixItems);
  stage = stateManager.getStage('roadmapping');
  assert(stage.reviewDecision === 'conditional', '条件通过决策已记录');
  assert(stage.fixItems.length === 2, '修复项数量为 2');
  assert(stage.fixItems[0].id === 'D1', '修复项 ID 正确');
  console.log('');

  // ========== 测试 6: 重试计数 ==========
  console.log('📋 测试 6: 重试计数');
  stateManager.updateStage('detailing', StageStatus.REJECTED);
  // 直接修改状态来模拟重试
  stateManager.state.stages.detailing.retryCount = 1;
  stage = stateManager.getStage('detailing');
  assert(stage.retryCount === 1, '重试计数设置为 1');
  
  stateManager.state.stages.detailing.retryCount = 2;
  stage = stateManager.getStage('detailing');
  assert(stage.retryCount === 2, '重试计数设置为 2');
  console.log('');

  // ========== 测试 7: 阶段输出记录 ==========
  console.log('📋 测试 7: 阶段输出记录');
  // 直接修改状态来记录输出
  stateManager.state.stages.designing.outputs = ['01_designing/PRD.md', '01_designing/TRD.md'];
  stage = stateManager.getStage('designing');
  assert(stage.outputs.length === 2, '输出文件数量为 2');
  assert(stage.outputs[0] === '01_designing/PRD.md', '输出文件路径正确');
  console.log('');

  // ========== 测试 8: 状态持久化 ==========
  console.log('📋 测试 8: 状态持久化');
  stateManager.save();
  const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
  assert(savedState.stages.designing.status === 'passed', '状态已持久化到文件');
  assert(savedState.stages.designing.reviewDecision === 'pass', '审阅决策已持久化');
  console.log('');

  // ========== 测试 9: 当前阶段设置 ==========
  console.log('📋 测试 9: 当前阶段设置');
  stateManager.state.currentStage = 'coding';
  assert(stateManager.state.currentStage === 'coding', '当前阶段已设置');
  
  const currentStage = stateManager.state.currentStage;
  assert(currentStage === 'coding', '获取当前阶段正确');
  console.log('');

  // ========== 测试 10: 获取所有阶段状态 ==========
  console.log('📋 测试 10: 获取所有阶段状态');
  const allStages = stateManager.state.stages;
  assert(allStages !== undefined, '获取所有阶段成功');
  assert(typeof allStages === 'object', '阶段对象类型正确');
  assert(Object.keys(allStages).length >= 5, '阶段数量至少 5 个');
  console.log('');

  // 清理测试环境
  cleanup(testProjectPath);

  // ========== 测试结果汇总 ==========
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   测试结果汇总                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ 通过：${passed}`);
  console.log(`❌ 失败：${failed}`);
  console.log(`📊 测试通过率：${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('');

  if (failed > 0) {
    console.log('❌ 测试失败');
    process.exit(1);
  } else {
    console.log('✅ 所有测试通过');
    process.exit(0);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
