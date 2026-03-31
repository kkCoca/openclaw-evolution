#!/usr/bin/env node

/**
 * Review Code Agent 测试脚本
 */

const path = require('path');
const ReviewCodeAgent = require('./review-agents/review-code');

// 测试配置
const config = {
  reviewer: 'openclaw-ouyp'
};

// 测试输入（使用 uri-to-markdown 项目）
const testInput = {
  codeDir: path.join(__dirname, '04_coding/src')
};

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ClawDevFlow Review Code Agent 测试                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // 测试 1: ReviewCodeAgent 实例化
  console.log('📋 测试 1: ReviewCodeAgent 实例化检查');
  try {
    const agent = new ReviewCodeAgent(config);
    console.log('✅ 通过：ReviewCodeAgent 能正常实例化');
    passed++;
  } catch (error) {
    console.log('❌ 失败：ReviewCodeAgent 实例化失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 2: 加载检查点
  console.log('📋 测试 2: ReviewCodeAgent 检查点加载');
  try {
    const agent = new ReviewCodeAgent(config);
    const checkpoints = agent.loadCheckpoints();
    
    if (Array.isArray(checkpoints) && checkpoints.length > 0) {
      console.log(`✅ 通过：加载了 ${checkpoints.length} 个检查点`);
      console.log('   检查点列表:');
      checkpoints.forEach(cp => {
        console.log(`     - ${cp.id}: ${cp.name} (${cp.type}, 权重：${cp.weight})`);
      });
      passed++;
    } else {
      console.log('❌ 失败：检查点列表为空');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：检查点加载失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 3: 检查代码目录是否存在
  console.log('📋 测试 3: 代码目录检查');
  const fs = require('fs');
  if (fs.existsSync(testInput.codeDir)) {
    console.log(`✅ 通过：代码目录存在 ${testInput.codeDir}`);
    passed++;
  } else {
    console.log(`⬜ 跳过：代码目录不存在 ${testInput.codeDir}`);
  }
  console.log('');

  // 测试 4: 实际执行 ReviewCodeAgent（如果目录存在）
  console.log('📋 测试 4: ReviewCodeAgent 实际执行');
  try {
    const agent = new ReviewCodeAgent(config);
    
    if (fs.existsSync(testInput.codeDir)) {
      console.log('   测试目录存在，执行检查...');
      const report = await agent.execute(testInput);
      
      if (report && report.stage === 'coding' && report.summary) {
        console.log('✅ 通过：ReviewCodeAgent 执行成功');
        console.log(`   检查结果：${report.summary.passed}/${report.summary.total} 通过`);
        console.log(`   质量评分：${report.summary.score}/100 (${report.summary.qualityLevel})`);
        console.log('   检查点详情:');
        report.checkpoints.forEach(cp => {
          const icon = cp.status === 'pass' ? '✅' : cp.status === 'fail' ? '❌' : '⚠️';
          console.log(`     ${icon} ${cp.id}: ${cp.name} - ${cp.status}`);
        });
        passed++;
      } else {
        console.log('❌ 失败：报告格式不正确');
        failed++;
      }
    } else {
      console.log('⬜ 跳过：代码目录不存在');
    }
  } catch (error) {
    console.log('❌ 失败：ReviewCodeAgent 执行失败:', error.message);
    console.log('   错误堆栈:', error.stack);
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
    console.log('🎉 所有测试通过！Review Code Agent 工作正常。');
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
