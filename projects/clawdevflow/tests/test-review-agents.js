#!/usr/bin/env node

/**
 * Review Agent 测试脚本
 * 
 * 用于验证审阅 Agent 系统是否正常工作
 */

const path = require('path');
const fs = require('fs');

// 导入模块
const ReviewAgentBase = require('./review-framework/review-agent-base');
const ReviewDesignAgent = require('./review-agents/review-design');
const ReviewRequestGenerator = require('./review-generators/review-request-generator');

// 测试配置
const config = {
  reviewer: 'openclaw-ouyp',
  projectPath: '/home/ouyp/Learning/Practice/openclaw-universe/projects/uri-to-markdown'
};

// 测试数据
const testInput = {
  requirementsFile: path.join(config.projectPath, 'REQUIREMENTS.md'),
  prdFile: path.join(config.projectPath, '01_designing/PRD.md'),
  trdFile: path.join(config.projectPath, '01_designing/TRD.md')
};

const testOutputs = [
  { name: 'PRD.md', path: '01_designing/PRD.md', status: '✅ 已生成' },
  { name: 'TRD.md', path: '01_designing/TRD.md', status: '✅ 已生成' }
];

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ClawDevFlow Review Agent 测试                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // 测试 1: ReviewAgentBase 不能直接实例化
  console.log('📋 测试 1: ReviewAgentBase 抽象类检查');
  try {
    new ReviewAgentBase('test', {});
    console.log('❌ 失败：ReviewAgentBase 不应该能直接实例化');
    failed++;
  } catch (error) {
    if (error.message.includes('抽象类')) {
      console.log('✅ 通过：ReviewAgentBase 不能直接实例化');
      passed++;
    } else {
      console.log('❌ 失败：错误信息不正确');
      failed++;
    }
  }
  console.log('');

  // 测试 2: ReviewDesignAgent 能正常实例化
  console.log('📋 测试 2: ReviewDesignAgent 实例化检查');
  try {
    const agent = new ReviewDesignAgent(config);
    console.log('✅ 通过：ReviewDesignAgent 能正常实例化');
    passed++;
    
    // 测试 3: ReviewDesignAgent 有正确的方法
    console.log('');
    console.log('📋 测试 3: ReviewDesignAgent 方法检查');
    if (typeof agent.execute === 'function' &&
        typeof agent.loadCheckpoints === 'function' &&
        typeof agent.validateCheckpoint === 'function') {
      console.log('✅ 通过：ReviewDesignAgent 有必需的方法');
      passed++;
    } else {
      console.log('❌ 失败：ReviewDesignAgent 缺少必需的方法');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：ReviewDesignAgent 实例化失败:', error.message);
    failed += 2;
  }
  console.log('');

  // 测试 4: ReviewDesignAgent 加载检查点
  console.log('📋 测试 4: ReviewDesignAgent 检查点加载');
  try {
    const agent = new ReviewDesignAgent(config);
    const checkpoints = agent.loadCheckpoints();
    
    if (Array.isArray(checkpoints) && checkpoints.length > 0) {
      console.log(`✅ 通过：加载了 ${checkpoints.length} 个检查点`);
      console.log('   检查点列表:');
      checkpoints.forEach(cp => {
        console.log(`     - ${cp.id}: ${cp.name} (${cp.type})`);
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

  // 测试 5: ReviewRequestGenerator 生成审阅请求
  console.log('📋 测试 5: ReviewRequestGenerator 生成审阅请求');
  try {
    const generator = new ReviewRequestGenerator(config);
    
    const mockReport = {
      stage: 'designing',
      timestamp: new Date().toISOString(),
      summary: {
        total: 6,
        passed: 5,
        failed: 0,
        warnings: 1,
        pending: 0,
        score: 85,
        qualityLevel: '良好'
      },
      checkpoints: [
        { id: 'D1', name: '需求覆盖率', type: 'auto', status: 'pass', description: '100% 覆盖' },
        { id: 'D2', name: '文档完整性', type: 'auto', status: 'pass', description: '章节完整' },
        { id: 'D3', name: '无模糊词', type: 'auto', status: 'warning', description: '发现 3 处模糊词' },
        { id: 'D4', name: '技术选型', type: 'ai', status: 'pass', description: '有比较表' },
        { id: 'D5', name: '向后兼容', type: 'auto', status: 'pass', description: '有兼容性说明' },
        { id: 'D6', name: '异常处理', type: 'ai', status: 'pass', description: '覆盖完整' }
      ],
      conclusion: 'pass',
      duration: 1234
    };

    const content = generator.generate('designing', mockReport, testOutputs);
    
    if (content.includes('审阅请求') && 
        content.includes('Design（设计）') &&
        content.includes('自动检查结果')) {
      console.log('✅ 通过：审阅请求生成成功');
      console.log('   生成内容预览:');
      console.log('   ' + content.split('\n').slice(0, 10).join('\n   '));
      passed++;
    } else {
      console.log('❌ 失败：审阅请求内容不正确');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：审阅请求生成失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 6: 实际执行 ReviewDesignAgent（如果文件存在）
  console.log('📋 测试 6: ReviewDesignAgent 实际执行');
  try {
    const agent = new ReviewDesignAgent(config);
    
    // 检查测试文件是否存在
    if (fs.existsSync(testInput.requirementsFile) &&
        fs.existsSync(testInput.prdFile) &&
        fs.existsSync(testInput.trdFile)) {
      
      console.log('   测试文件存在，执行检查...');
      const report = await agent.execute(testInput);
      
      if (report && report.stage === 'designing' && report.summary) {
        console.log('✅ 通过：ReviewDesignAgent 执行成功');
        console.log(`   检查结果：${report.summary.passed}/${report.summary.total} 通过`);
        console.log(`   质量评分：${report.summary.score}/100`);
        passed++;
      } else {
        console.log('❌ 失败：报告格式不正确');
        failed++;
      }
    } else {
      console.log('⬜ 跳过：测试文件不存在');
      console.log(`   REQUIREMENTS.md: ${testInput.requirementsFile}`);
      console.log(`   PRD.md: ${testInput.prdFile}`);
      console.log(`   TRD.md: ${testInput.trdFile}`);
    }
  } catch (error) {
    console.log('❌ 失败：ReviewDesignAgent 执行失败:', error.message);
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
    console.log('🎉 所有测试通过！审阅 Agent 系统工作正常。');
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
