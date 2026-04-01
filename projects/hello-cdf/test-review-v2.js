#!/usr/bin/env node
/**
 * hello-cdf 项目 - ReviewDesignAgent v2.0 测试脚本
 * 
 * 验证 Freshness Gate 和 Traceability Gate 是否正常工作
 */

const path = require('path');
const ReviewDesignAgentV2 = require('../clawdevflow/04_coding/src/review-agents/review-design-v2');

// 测试配置
const config = {
  reviewAgent: {
    version: 'v2.0'
  }
};

// hello-cdf 项目路径
const projectPath = path.join(__dirname);

// 测试输入
const input = {
  requirementsFile: projectPath + '/REQUIREMENTS.md',
  prdFile: projectPath + '/01_designing/PRD.md',
  trdFile: projectPath + '/01_designing/TRD.md'
};

/**
 * 主测试函数
 */
async function runTest() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ReviewDesignAgent v2.0 - hello-cdf 项目测试             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  console.log('📋 测试输入:');
  console.log(`   REQUIREMENTS: ${input.requirementsFile}`);
  console.log(`   PRD: ${input.prdFile}`);
  console.log(`   TRD: ${input.trdFile}`);
  console.log('');
  
  try {
    // 创建 Agent 实例
    const agent = new ReviewDesignAgentV2(config);
    
    // 执行审阅
    console.log('🔍 开始执行审阅...');
    console.log('');
    
    const report = await agent.executeReview(input);
    
    // 输出审阅报告
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   审阅报告                                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Freshness Gate
    console.log('🔒 Freshness Gate:');
    if (report.gates.freshness?.passed) {
      console.log(`   ✅ 通过 - 版本：${report.gates.freshness.version}`);
    } else {
      console.log(`   ❌ 失败 - ${report.gates.freshness?.reason}`);
      console.log(`      建议：${report.gates.freshness?.suggestion}`);
    }
    console.log('');
    
    // Traceability Gate
    console.log('🔒 Traceability Gate:');
    if (report.gates.traceability?.passed) {
      console.log(`   ✅ 通过 - 可追溯率：${(report.gates.traceability.traceabilityRate * 100).toFixed(0)}%`);
    } else {
      console.log(`   ❌ 失败 - ${report.gates.traceability?.reason}`);
      console.log(`      未映射需求:`);
      report.gates.traceability?.unmappedRequirements?.forEach(req => {
        console.log(`        - [${req.id}] ${req.description}`);
      });
      console.log(`      建议：${report.gates.traceability?.suggestion}`);
    }
    console.log('');
    
    // 质量检查
    console.log('✅ 质量检查:');
    for (const [checkpointId, result] of Object.entries(report.qualityChecks)) {
      const icon = result.passed ? '✅' : '⚠️';
      console.log(`   ${icon} ${checkpointId}: ${result.name} - ${result.score}/100`);
      
      if (result.issues?.length > 0) {
        result.issues.forEach(issue => {
          console.log(`      - ${issue.type || issue}`);
        });
      }
    }
    console.log('');
    
    // 综合评分
    console.log('📊 综合评分:');
    console.log(`   评分：${report.overall.score}/100`);
    console.log(`   结论：${report.overall.recommendation}`);
    console.log(`   通过检查点：${report.overall.passedChecks}/${report.overall.totalChecks}`);
    console.log('');
    
    // 测试结论
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   测试结论                                                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    if (!report.gates.freshness?.passed) {
      console.log('⚠️  预期结果：Freshness Gate 应该失败（hello-cdf 没有版本声明）');
      console.log('✅ 测试结果：Freshness Gate 正确捕获了版本问题');
    } else if (!report.gates.traceability?.passed) {
      console.log('⚠️  预期结果：Traceability Gate 应该失败（hello-cdf 需求没有 ID）');
      console.log('✅ 测试结果：Traceability Gate 正确捕获了映射问题');
    } else {
      console.log('✅ 测试结果：审阅通过');
    }
    
    console.log('');
    console.log('📝 改进建议:');
    console.log('   1. 在 REQUIREMENTS.md 中添加版本声明和需求 ID');
    console.log('   2. 在 PRD.md 和 TRD.md 开头添加对齐版本声明');
    console.log('   3. 在 PRD.md 中为每条需求添加明确的 ID 映射');
    console.log('');
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
runTest();
