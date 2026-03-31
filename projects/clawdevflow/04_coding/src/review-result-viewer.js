#!/usr/bin/env node

/**
 * Review Result Viewer CLI (审阅结果查看器命令行工具)
 * 
 * 用于查看和管理审阅结果
 * 
 * 使用方式：
 *   node review-result-viewer.js list [workflowId]
 *   node review-result-viewer.js show <workflowId> [stageName]
 *   node review-result-viewer.js report <workflowId>
 */

const path = require('path');
const ReviewResultManager = require('./review-orchestrator/review-result-manager');

// 创建管理器实例
const manager = new ReviewResultManager({});

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const workflowId = args[1];
  const stageName = args[2];

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ClawDevFlow 审阅结果查看器                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  switch (command) {
    case 'list':
      await listWorkflows(workflowId);
      break;

    case 'show':
      await showReview(workflowId, stageName);
      break;

    case 'report':
      await showReport(workflowId);
      break;

    case 'help':
    default:
      showHelp();
  }
}

/**
 * 列出工作流审阅结果
 */
async function listWorkflows(workflowId) {
  console.log('📋 审阅结果列表');
  console.log('');

  if (workflowId) {
    // 显示特定工作流的结果
    const results = manager.loadByWorkflow(workflowId);
    
    if (results.length === 0) {
      console.log(`⬜ 工作流 ${workflowId} 没有审阅结果`);
      return;
    }

    console.log(`工作流：${workflowId}`);
    console.log('');
    console.log('阶段审阅状态:');
    console.log('');

    const stages = {};
    for (const result of results) {
      if (!stages[result.stage]) {
        stages[result.stage] = [];
      }
      stages[result.stage].push(result);
    }

    for (const [stage, stageResults] of Object.entries(stages)) {
      const latest = stageResults[stageResults.length - 1];
      const icon = latest.decision === 'pass' ? '✅' :
                   latest.decision === 'conditional' ? '⚠️' :
                   latest.decision === 'reject' ? '❌' : '❓';
      
      console.log(`${icon} ${stage}: ${latest.decision}`);
      console.log(`   审阅次数：${stageResults.length}`);
      console.log(`   质量评分：${latest.score ? latest.score.overall + '/100' : '无'}`);
      console.log(`   待修复项：${latest.fixItems ? latest.fixItems.length : 0} 项`);
      console.log(`   最后审阅：${new Date(latest.savedAt).toLocaleString()}`);
      console.log('');
    }
  } else {
    // 列出所有工作流
    console.log('使用方式：node review-result-viewer.js list <workflowId>');
    console.log('');
    console.log('示例：');
    console.log('  node review-result-viewer.js list wf-20260331-001');
  }
}

/**
 * 显示审阅详情
 */
async function showReview(workflowId, stageName) {
  if (!workflowId) {
    console.log('❌ 请提供工作流 ID');
    console.log('');
    console.log('使用方式：node review-result-viewer.js show <workflowId> [stageName]');
    return;
  }

  console.log(`📄 审阅详情：${workflowId}`);
  console.log('');

  if (stageName) {
    // 显示特定阶段的审阅结果
    const result = manager.getLatestByStage(workflowId, stageName);
    
    if (!result) {
      console.log(`⬜ 阶段 ${stageName} 没有审阅结果`);
      return;
    }

    printReviewResult(result);
  } else {
    // 显示所有阶段的审阅结果
    const results = manager.loadByWorkflow(workflowId);
    
    if (results.length === 0) {
      console.log(`⬜ 工作流 ${workflowId} 没有审阅结果`);
      return;
    }

    for (const result of results) {
      printReviewResult(result);
      console.log('');
      console.log('─────────────────────────────────────────────────────────');
      console.log('');
    }
  }
}

/**
 * 显示审阅报告
 */
async function showReport(workflowId) {
  if (!workflowId) {
    console.log('❌ 请提供工作流 ID');
    console.log('');
    console.log('使用方式：node review-result-viewer.js report <workflowId>');
    return;
  }

  console.log(`📊 审阅报告：${workflowId}`);
  console.log('');

  const report = manager.generateReport(workflowId);

  console.log('总体统计:');
  console.log(`  总审阅次数：${report.totalReviews}`);
  console.log(`  已通过阶段：${report.passedStages}`);
  console.log(`  待修复项：${report.totalFixItems} 项`);
  console.log(`  平均评分：${report.averageScore}/100`);
  console.log('');

  console.log('阶段详情:');
  console.log('');

  for (const [stage, data] of Object.entries(report.stages)) {
    const icon = data.passed ? '✅' : '❌';
    console.log(`${icon} ${stage}`);
    console.log(`   审阅次数：${data.reviews}`);
    console.log(`   审阅结论：${data.latestDecision || '无'}`);
    console.log(`   待修复项：${data.fixItems.length} 项`);
    
    if (data.fixItems.length > 0) {
      console.log('   待修复项列表:');
      data.fixItems.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.description} (${item.severity})`);
      });
    }
    
    console.log('');
  }
}

/**
 * 打印审阅结果详情
 */
function printReviewResult(result) {
  const icon = result.decision === 'pass' ? '✅' :
               result.decision === 'conditional' ? '⚠️' :
               result.decision === 'reject' ? '❌' : '❓';

  console.log(`${icon} 阶段：${result.stage}`);
  console.log(`   审阅结论：${result.decision}`);
  console.log(`   质量评分：${result.score ? result.score.overall + '/100' : '无'}`);
  console.log(`   审阅时间：${new Date(result.savedAt).toLocaleString()}`);
  
  if (result.notes) {
    console.log('');
    console.log('   审阅意见:');
    console.log('   ─────────────────────────────────────────────────────');
    result.notes.split('\n').forEach(line => {
      console.log(`   ${line}`);
    });
    console.log('   ─────────────────────────────────────────────────────');
  }
  
  if (result.fixItems && result.fixItems.length > 0) {
    console.log('');
    console.log('   待修复项:');
    result.fixItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.description}`);
      console.log(`      严重程度：${item.severity}`);
      console.log(`      修复期限：${item.deadline}`);
    });
  }
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log('使用方式:');
  console.log('  node review-result-viewer.js <command> [arguments]');
  console.log('');
  console.log('命令:');
  console.log('  list [workflowId]           列出审阅结果');
  console.log('  show <workflowId> [stage]   显示审阅详情');
  console.log('  report <workflowId>         显示审阅报告');
  console.log('  help                        显示此帮助信息');
  console.log('');
  console.log('示例:');
  console.log('  node review-result-viewer.js list wf-20260331-001');
  console.log('  node review-result-viewer.js show wf-20260331-001 designing');
  console.log('  node review-result-viewer.js report wf-20260331-001');
  console.log('');
}

// 运行主函数
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  });
