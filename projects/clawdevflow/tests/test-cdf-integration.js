#!/usr/bin/env node

/**
 * CDF 集成测试脚本
 * 
 * 测试审阅系统与 CDF Orchestrator 的完整集成
 */

const path = require('path');
const fs = require('fs');
const ReviewOrchestrator = require('./review-orchestrator/review-orchestrator');
const ReviewResultManager = require('./review-orchestrator/review-result-manager');

// 测试配置
const config = {
  reviewer: 'openclaw-ouyp',
  pollInterval: 2000, // 2 秒轮询（测试用）
  timeout: 300000 // 5 分钟超时
};

// 测试项目路径
const testProjectPath = path.join(__dirname, 'test-project');

/**
 * 主测试函数
 */
async function runIntegrationTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ClawDevFlow CDF 集成测试                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // 测试 1: ReviewResultManager 保存和加载
  console.log('📋 测试 1: ReviewResultManager 保存和加载测试');
  try {
    const manager = new ReviewResultManager(config);
    
    const testResult = {
      decision: 'pass',
      notes: '整体质量良好，技术选型合理',
      fixItems: [],
      score: { overall: 92 }
    };
    
    const filePath = manager.save('wf-test-001', 'designing', testResult);
    
    if (fs.existsSync(filePath)) {
      console.log('✅ 通过：审阅结果保存成功');
      
      // 测试加载
      const results = manager.loadByWorkflow('wf-test-001');
      if (results.length > 0 && results[0].decision === 'pass') {
        console.log('✅ 通过：审阅结果加载成功');
        passed += 2;
      } else {
        console.log('❌ 失败：审阅结果加载失败');
        failed += 2;
      }
    } else {
      console.log('❌ 失败：审阅结果文件未创建');
      failed += 2;
    }
  } catch (error) {
    console.log('❌ 失败：ReviewResultManager 测试失败:', error.message);
    failed += 2;
  }
  console.log('');

  // 测试 2: ReviewResultManager 阶段状态检查
  console.log('📋 测试 2: ReviewResultManager 阶段状态检查');
  try {
    const manager = new ReviewResultManager(config);
    
    // 保存通过的审阅结果
    manager.save('wf-test-002', 'designing', {
      decision: 'pass',
      notes: '通过',
      fixItems: [],
      score: { overall: 90 }
    });
    
    // 检查阶段是否通过
    const isPassed = manager.isStagePassed('wf-test-002', 'designing');
    
    if (isPassed) {
      console.log('✅ 通过：阶段状态检查正确（已通过）');
      passed++;
    } else {
      console.log('❌ 失败：阶段状态检查错误');
      failed++;
    }
    
    // 检查未审阅的阶段
    const isNotPassed = manager.isStagePassed('wf-test-002', 'coding');
    
    if (!isNotPassed) {
      console.log('✅ 通过：未审阅阶段检查正确（未通过）');
      passed++;
    } else {
      console.log('❌ 失败：未审阅阶段检查错误');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：阶段状态检查测试失败:', error.message);
    failed += 2;
  }
  console.log('');

  // 测试 3: ReviewResultManager 待修复项收集
  console.log('📋 测试 3: ReviewResultManager 待修复项收集');
  try {
    const manager = new ReviewResultManager(config);
    
    // 保存带待修复项的审阅结果
    manager.save('wf-test-003', 'designing', {
      decision: 'conditional',
      notes: '条件通过',
      fixItems: [
        { id: 'F1', description: '修改模糊词', severity: '低', deadline: 'v1.1.0' },
        { id: 'F2', description: '补充文档', severity: '中', deadline: 'v1.1.0' }
      ],
      score: { overall: 85 }
    });
    
    // 获取所有待修复项
    const allFixItems = manager.getAllFixItems('wf-test-003');
    
    if (allFixItems.length === 2) {
      console.log('✅ 通过：待修复项收集正确（2 项）');
      passed++;
    } else {
      console.log(`❌ 失败：待修复项收集错误（期望 2 项，实际 ${allFixItems.length} 项）`);
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：待修复项收集测试失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 4: ReviewResultManager 报告生成
  console.log('📋 测试 4: ReviewResultManager 报告生成');
  try {
    const manager = new ReviewResultManager(config);
    
    // 保存多个阶段的审阅结果
    manager.save('wf-test-004', 'designing', {
      decision: 'pass',
      notes: '设计通过',
      fixItems: [],
      score: { overall: 90 }
    });
    
    manager.save('wf-test-004', 'coding', {
      decision: 'conditional',
      notes: '代码条件通过',
      fixItems: [{ id: 'F1', description: '修复 ESLint 警告', severity: '低', deadline: 'v1.0.1' }],
      score: { overall: 85 }
    });
    
    // 生成报告
    const report = manager.generateReport('wf-test-004');
    
    if (report.totalReviews === 2 && 
        report.passedStages === 2 && 
        report.totalFixItems === 1 &&
        report.averageScore > 0) {
      console.log('✅ 通过：报告生成正确');
      console.log(`   总审阅次数：${report.totalReviews}`);
      console.log(`   已通过阶段：${report.passedStages}`);
      console.log(`   待修复项：${report.totalFixItems} 项`);
      console.log(`   平均评分：${report.averageScore}/100`);
      passed++;
    } else {
      console.log('❌ 失败：报告生成错误');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：报告生成测试失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 5: ReviewOrchestrator 集成
  console.log('📋 测试 5: ReviewOrchestrator 集成检查');
  try {
    const orchestrator = new ReviewOrchestrator(config);
    
    // 检查是否有 review 方法
    if (typeof orchestrator.review === 'function') {
      console.log('✅ 通过：ReviewOrchestrator 有 review 方法');
      passed++;
    } else {
      console.log('❌ 失败：ReviewOrchestrator 缺少 review 方法');
      failed++;
    }
    
    // 检查已注册的 Agent
    const stages = orchestrator.getAvailableStages();
    if (stages.includes('designing') && stages.includes('coding')) {
      console.log(`✅ 通过：已注册 ${stages.length} 个 Agent (${stages.join(', ')})`);
      passed++;
    } else {
      console.log('❌ 失败：缺少必需的 Agent');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：ReviewOrchestrator 集成测试失败:', error.message);
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
    console.log('🎉 所有测试通过！CDF 集成完成。');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('阶段 4 实施完成！');
    console.log('已创建文件:');
    console.log('  - review-orchestrator/review-result-manager.js');
    console.log('  - review-result-viewer.js');
    console.log('  - test-cdf-integration.js');
    console.log('═══════════════════════════════════════════════════════════');
    return 0;
  } else {
    console.log('⚠️  有测试失败，请检查错误信息。');
    return 1;
  }
}

// 运行测试
runIntegrationTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
