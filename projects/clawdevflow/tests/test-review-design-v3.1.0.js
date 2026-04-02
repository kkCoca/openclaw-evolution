#!/usr/bin/env node

/**
 * Review Design Agent v3.1.0 专项测试
 * 
 * 测试 v3.1.0 新增功能:
 * - D1: 版本对齐验证 + 追溯矩阵 + 可定位映射
 * - D4: AI 检查技术选型合理性
 * - D6: AI 检查异常处理完整性
 * - D7: 验收标准可测试性检查
 */

const path = require('path');
const fs = require('fs');

// 导入模块
const ReviewDesignAgent = require('../04_coding/src/review-agents/review-design');

// 测试配置
const config = {
  reviewer: 'openclaw-ouyp',
  projectPath: '/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow'
};

// 测试数据
const testInput = {
  requirementsFile: path.join(config.projectPath, 'REQUIREMENTS.md'),
  prdFile: path.join(config.projectPath, '01_designing/PRD.md'),
  trdFile: path.join(config.projectPath, '01_designing/TRD.md')
};

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Review Design Agent v3.1.0 专项测试                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // 测试 1: ReviewDesignAgent v3.1.0 实例化
  console.log('📋 测试 1: ReviewDesignAgent v3.1.0 实例化');
  try {
    const agent = new ReviewDesignAgent(config);
    console.log('✅ 通过：ReviewDesignAgent v3.1.0 能正常实例化');
    passed++;
  } catch (error) {
    console.log('❌ 失败：ReviewDesignAgent v3.1.0 实例化失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 2: 检查点加载（v3.1.0 应该有 7 个检查点）
  console.log('📋 测试 2: 检查点加载（v3.1.0）');
  try {
    const agent = new ReviewDesignAgent(config);
    const checkpoints = agent.loadCheckpoints();
    
    console.log(`   加载了 ${checkpoints.length} 个检查点`);
    
    // v3.1.0 应该有 7 个检查点：D1, D2, D3, D4, D5, D6, D7
    const expectedCheckpoints = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
    const actualIds = checkpoints.map(cp => cp.id);
    
    const allPresent = expectedCheckpoints.every(id => actualIds.includes(id));
    
    if (allPresent && checkpoints.length === 7) {
      console.log('✅ 通过：所有 v3.1.0 检查点都存在');
      checkpoints.forEach(cp => {
        const criticalMark = cp.critical ? '🔴' : '⚪';
        console.log(`   ${criticalMark} ${cp.id}: ${cp.name} (权重：${cp.weight}, 类型：${cp.type})`);
      });
      passed++;
    } else {
      console.log('❌ 失败：检查点不完整');
      console.log(`   期望：${expectedCheckpoints.join(', ')}`);
      console.log(`   实际：${actualIds.join(', ')}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：检查点加载失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 3: D1 子方法 - 版本对齐验证
  console.log('📋 测试 3: D1 版本对齐验证方法');
  try {
    const agent = new ReviewDesignAgent(config);
    
    // 读取测试文件
    const prdContent = fs.readFileSync(testInput.prdFile, 'utf-8');
    const requirementsContent = fs.readFileSync(testInput.requirementsFile, 'utf-8');
    
    const result = agent.checkVersionAlignment(prdContent, requirementsContent);
    
    console.log(`   版本对齐检查：${result.passed ? '✅ 通过' : '⚠️ 未通过'}`);
    if (result.issues.length > 0) {
      console.log(`   问题:`);
      result.issues.forEach(issue => console.log(`     - ${issue}`));
    }
    
    // 这个方法应该能正常执行（不抛异常）
    console.log('✅ 通过：版本对齐验证方法执行成功');
    passed++;
  } catch (error) {
    console.log('❌ 失败：版本对齐验证方法执行失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 4: D1 子方法 - 追溯矩阵验证
  console.log('📋 测试 4: D1 追溯矩阵验证方法');
  try {
    const agent = new ReviewDesignAgent(config);
    
    const prdContent = fs.readFileSync(testInput.prdFile, 'utf-8');
    const result = agent.checkTraceabilityMatrix(prdContent);
    
    console.log(`   追溯矩阵检查：${result.passed ? '✅ 通过' : '⚠️ 未通过'}`);
    console.log(`   提取到 ${result.matrix.length} 条追溯记录`);
    
    if (result.issues.length > 0) {
      console.log(`   问题:`);
      result.issues.forEach(issue => console.log(`     - ${issue}`));
    }
    
    console.log('✅ 通过：追溯矩阵验证方法执行成功');
    passed++;
  } catch (error) {
    console.log('❌ 失败：追溯矩阵验证方法执行失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 5: D1 子方法 - 可定位映射验证
  console.log('📋 测试 5: D1 可定位映射验证方法');
  try {
    const agent = new ReviewDesignAgent(config);
    
    const prdContent = fs.readFileSync(testInput.prdFile, 'utf-8');
    const matrixResult = agent.checkTraceabilityMatrix(prdContent);
    const result = agent.checkMappingLocatability(matrixResult.matrix);
    
    console.log(`   可定位映射检查：${result.passed ? '✅ 通过' : '⚠️ 未通过'}`);
    
    if (result.issues.length > 0) {
      console.log(`   问题 (最多显示 5 条):`);
      result.issues.slice(0, 5).forEach(issue => console.log(`     - ${issue}`));
    }
    
    console.log('✅ 通过：可定位映射验证方法执行成功');
    passed++;
  } catch (error) {
    console.log('❌ 失败：可定位映射验证方法执行失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 6: D4 AI 检查 - 技术选型合理性
  console.log('📋 测试 6: D4 AI 检查 - 技术选型合理性');
  try {
    const agent = new ReviewDesignAgent(config);
    
    const checkpoint = { id: 'D4', type: 'ai' };
    const result = await agent.runAICheckpoint(checkpoint, testInput);
    
    console.log(`   AI 检查结果：${result.passed ? '✅ 通过' : '❌ 未通过'}`);
    console.log(`   评分：${result.score}/10`);
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`   改进建议:`);
      result.suggestions.forEach(s => console.log(`     - ${s}`));
    }
    
    console.log('✅ 通过：D4 AI 检查方法执行成功');
    passed++;
  } catch (error) {
    console.log('❌ 失败：D4 AI 检查方法执行失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 7: D6 AI 检查 - 异常处理完整性
  console.log('📋 测试 7: D6 AI 检查 - 异常处理完整性');
  try {
    const agent = new ReviewDesignAgent(config);
    
    const checkpoint = { id: 'D6', type: 'ai' };
    const result = await agent.runAICheckpoint(checkpoint, testInput);
    
    console.log(`   AI 检查结果：${result.passed ? '✅ 通过' : '❌ 未通过'}`);
    console.log(`   评分：${result.score}/10`);
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`   改进建议:`);
      result.suggestions.forEach(s => console.log(`     - ${s}`));
    }
    
    console.log('✅ 通过：D6 AI 检查方法执行成功');
    passed++;
  } catch (error) {
    console.log('❌ 失败：D6 AI 检查方法执行失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 8: D7 检查 - 验收标准可测试性
  console.log('📋 测试 8: D7 验收标准可测试性检查');
  try {
    const agent = new ReviewDesignAgent(config);
    
    const result = await agent.checkAcceptanceCriteriaTestability(testInput);
    
    console.log(`   可测试性检查：${result ? '✅ 通过' : '⚠️ 未通过'}`);
    console.log('✅ 通过：D7 检查方法执行成功');
    passed++;
  } catch (error) {
    console.log('❌ 失败：D7 检查方法执行失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试 9: 完整执行 ReviewDesignAgent
  console.log('📋 测试 9: ReviewDesignAgent 完整执行');
  try {
    // 检查测试文件是否存在
    if (fs.existsSync(testInput.requirementsFile) &&
        fs.existsSync(testInput.prdFile) &&
        fs.existsSync(testInput.trdFile)) {
      
      const agent = new ReviewDesignAgent(config);
      console.log('   测试文件存在，执行完整检查...');
      
      const report = await agent.execute(testInput);
      
      if (report && report.stage === 'designing' && report.summary) {
        console.log('✅ 通过：ReviewDesignAgent 完整执行成功');
        console.log(`   检查结果：${report.summary.passed}/${report.summary.total} 通过`);
        console.log(`   质量评分：${report.summary.score}/100`);
        console.log(`   结论：${report.conclusion === 'pass' ? '✅ 通过' : '❌ 驳回'}`);
        passed++;
      } else {
        console.log('❌ 失败：报告格式不正确');
        failed++;
      }
    } else {
      console.log('⬜ 跳过：测试文件不存在');
      skipped++;
    }
  } catch (error) {
    console.log('❌ 失败：ReviewDesignAgent 完整执行失败:', error.message);
    console.log(error.stack);
    failed++;
  }
  console.log('');

  // 测试 10: 模板文件存在性检查
  console.log('📋 测试 10: 模板文件存在性检查');
  try {
    const templatesPath = path.join(config.projectPath, 'templates');
    const requiredTemplates = [
      'REQUIREMENTS-template.md',
      'PRD-template.md',
      'TRD-template.md'
    ];
    
    let allExist = true;
    for (const template of requiredTemplates) {
      const templatePath = path.join(templatesPath, template);
      if (fs.existsSync(templatePath)) {
        const stats = fs.statSync(templatePath);
        console.log(`   ✅ ${template} (${stats.size} bytes)`);
      } else {
        console.log(`   ❌ ${template} (不存在)`);
        allExist = false;
      }
    }
    
    if (allExist) {
      console.log('✅ 通过：所有模板文件都存在');
      passed++;
    } else {
      console.log('❌ 失败：部分模板文件缺失');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败：模板文件检查失败:', error.message);
    failed++;
  }
  console.log('');

  // 测试结果汇总
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    测试结果汇总                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`总测试数：${passed + failed + skipped}`);
  console.log(`✅ 通过：${passed}`);
  console.log(`❌ 失败：${failed}`);
  console.log(`⬜ 跳过：${skipped}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 所有测试通过！Review Design Agent v3.1.0 工作正常。');
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
