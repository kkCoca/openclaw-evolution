#!/usr/bin/env node

/**
 * Review Orchestrator 测试脚本
 */

const path = require('path');
const ReviewOrchestrator = require('./review-orchestrator/review-orchestrator');
const ReviewDecisionParser = require('./review-orchestrator/review-decision-parser');

// 测试配置
const config = {
  reviewer: 'openclaw-ouyp',
  pollInterval: 2000, // 2 秒轮询（测试用）
  timeout: 60000 // 1 分钟超时（测试用）
};

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ClawDevFlow Review Orchestrator 测试                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // 测试 1: ReviewDecisionParser 解析测试
  console.log('📋 测试 1: ReviewDecisionParser 解析测试');
  try {
    const parser = new ReviewDecisionParser();
    
    const testContent = `
# 审阅请求：Design（设计）

**审阅结论**: \`pass\`

**审阅意见**:
\`\`\`
整体质量良好，技术选型合理。
建议进入下一阶段。
\`\`\`
    `;
    
    const result = parser.parse(testContent);
    
    if (result.decision === 'pass' && result.notes.includes('整体质量良好')) {
      console.log('✅ 通过：审阅结论解析正确');
      console.log(`   结论：${result.decision}`);
      console.log(`   意见：${result.notes.substring(0, 30)}...`);
      passed++;
    } else {
      console.log('❌ 失败：审阅结论解析错误');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：解析器测试失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 2: ReviewDecisionParser 多格式支持
  console.log('📋 测试 2: ReviewDecisionParser 多格式支持');
  try {
    const parser = new ReviewDecisionParser();
    
    const testCases = [
      { content: '**审阅结论**: `pass`', expected: 'pass' },
      { content: '**审阅结论**: `conditional`', expected: 'conditional' },
      { content: '**审阅结论**: `reject`', expected: 'reject' },
      { content: '**审阅结论**: `clarify`', expected: 'clarify' },
      { content: '**审阅结论**: `通过`', expected: 'pass' },
      { content: '**审阅结论**: `驳回`', expected: 'reject' },
    ];
    
    let allPassed = true;
    for (const testCase of testCases) {
      const result = parser.parse(testCase.content);
      if (result.decision !== testCase.expected) {
        console.log(`❌ "${testCase.content}" 解析为 ${result.decision}，期望 ${testCase.expected}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('✅ 通过：多格式支持测试通过');
      passed++;
    } else {
      console.log('❌ 失败：部分格式解析错误');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：多格式测试失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 3: ReviewOrchestrator 实例化
  console.log('📋 测试 3: ReviewOrchestrator 实例化检查');
  try {
    const orchestrator = new ReviewOrchestrator(config);
    console.log('✅ 通过：ReviewOrchestrator 能正常实例化');
    passed++;
    
    // 测试 4: 检查已注册的 Agent
    console.log('');
    console.log('📋 测试 4: ReviewOrchestrator Agent 注册检查');
    const stages = orchestrator.getAvailableStages();
    if (stages.includes('designing') && stages.includes('coding')) {
      console.log(`✅ 通过：已注册 ${stages.length} 个 Agent`);
      console.log('   已注册阶段:', stages.join(', '));
      passed++;
    } else {
      console.log('❌ 失败：缺少必需的 Agent');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：ReviewOrchestrator 实例化失败:', error.message);
    failed += 2;
  }
  console.log('');

  // 测试 5: ReviewOrchestrator review 方法存在
  console.log('📋 测试 5: ReviewOrchestrator 方法检查');
  try {
    const orchestrator = new ReviewOrchestrator(config);
    
    if (typeof orchestrator.review === 'function' &&
        typeof orchestrator.registerAgent === 'function') {
      console.log('✅ 通过：ReviewOrchestrator 有必需的方法');
      passed++;
    } else {
      console.log('❌ 失败：ReviewOrchestrator 缺少必需的方法');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：方法检查失败:', error.message);
    failed++;
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
    console.log('🎉 所有测试通过！Review Orchestrator 系统工作正常。');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('阶段 3 实施完成！');
    console.log('已创建文件:');
    console.log('  - review-orchestrator/review-decision-parser.js');
    console.log('  - review-orchestrator/review-workflow.js');
    console.log('  - review-orchestrator/review-orchestrator.js');
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
