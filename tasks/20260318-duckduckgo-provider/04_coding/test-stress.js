#!/usr/bin/env node
/**
 * DuckDuckGo Provider 压力测试脚本
 * 
 * 用途：验证 10 个 User-Agent 轮换池 + 请求头随机化的反爬效果
 * 
 * 用法：
 *   node test-stress.js [请求次数]
 *   默认：100 次
 * 
 * 验收标准：
 *   - 成功率 ≥95%
 *   - PARSE_ERROR ≤5 次
 *   - 平均响应时间 <2 秒
 */

import { DuckDuckGoSearchProvider } from './dist/src/index.js';

// ============ 配置 ============
const TOTAL_REQUESTS = parseInt(process.argv[2]) || 100;
const QUERY_TEMPLATE = 'OpenClaw gateway tutorial';
const DELAY_MS = 100; // 每次请求间隔 100ms（避免触发限流）
const BATCH_SIZE = 10; // 每 10 次请求暂停 1 秒
const BATCH_DELAY_MS = 1000;

// ============ 统计 ============
let successCount = 0;
let parseErrorCount = 0;
let networkErrorCount = 0;
let rateLimitCount = 0;
let responseTimes = [];
let userAgentDistribution = new Map();

// ============ 辅助函数 ============
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ============ 主测试流程 ============
console.log('========================================');
console.log('🚀 DDG Provider 压力测试');
console.log('========================================');
console.log(`总请求数：${TOTAL_REQUESTS}`);
console.log(`查询模板：${QUERY_TEMPLATE}`);
console.log(`请求间隔：${DELAY_MS}ms`);
console.log(`批次大小：${BATCH_SIZE} 次/批`);
console.log(`批次间隔：${BATCH_DELAY_MS}ms`);
console.log('========================================\n');

const startTime = Date.now();

for (let i = 1; i <= TOTAL_REQUESTS; i++) {
  const requestStart = Date.now();
  
  try {
    // 创建新的 Provider 实例（确保每次请求独立）
    const provider = new DuckDuckGoSearchProvider();
    const result = await provider.search({ 
      query: `${QUERY_TEMPLATE} ${i}`, 
      count: 1 
    });
    
    const responseTime = Date.now() - requestStart;
    responseTimes.push(responseTime);
    
    // 统计 User-Agent 使用情况（从结果中无法直接获取，跳过）
    
    if (result.results && result.results.length > 0) {
      successCount++;
      const status = responseTime < 1000 ? '✅' : responseTime < 2000 ? '⚠️' : '🐌';
      console.log(`[${i}/${TOTAL_REQUESTS}] ${status} 成功 (${formatTime(responseTime)})`);
    } else {
      parseErrorCount++;
      console.log(`[${i}/${TOTAL_REQUESTS}] ❌ PARSE_ERROR (无结果)`);
    }
  } catch (error) {
    const responseTime = Date.now() - requestStart;
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      rateLimitCount++;
      console.log(`[${i}/${TOTAL_REQUESTS}] 🚫 RATE_LIMITED (${formatTime(responseTime)})`);
    } else if (error.message.includes('PARSE_ERROR')) {
      parseErrorCount++;
      console.log(`[${i}/${TOTAL_REQUESTS}] ❌ PARSE_ERROR (${formatTime(responseTime)})`);
    } else {
      networkErrorCount++;
      console.log(`[${i}/${TOTAL_REQUESTS}] ❌ ${error.message} (${formatTime(responseTime)})`);
    }
  }
  
  // 批次延迟（每 10 次暂停 1 秒，避免触发限流）
  if (i % BATCH_SIZE === 0 && i < TOTAL_REQUESTS) {
    console.log(`\n--- 批次 ${i / BATCH_SIZE} 完成，暂停 ${BATCH_DELAY_MS}ms ---\n`);
    await sleep(BATCH_DELAY_MS);
  } else {
    await sleep(DELAY_MS);
  }
}

const totalTime = Date.now() - startTime;
const avgResponseTime = responseTimes.length > 0 
  ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
  : 0;
const successRate = (successCount / TOTAL_REQUESTS * 100).toFixed(2);
const failRate = ((parseErrorCount + networkErrorCount + rateLimitCount) / TOTAL_REQUESTS * 100).toFixed(2);

// ============ 输出报告 ============
console.log('\n========================================');
console.log('📊 压力测试报告');
console.log('========================================');
console.log(`总请求数：${TOTAL_REQUESTS}`);
console.log(`总耗时：${formatTime(totalTime)}`);
console.log(`平均 QPS: ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
console.log('');
console.log('【成功统计】');
console.log(`  ✅ 成功次数：${successCount}`);
console.log(`  📈 成功率：${successRate}%`);
console.log('');
console.log('【失败统计】');
console.log(`  ❌ 总失败次数：${parseErrorCount + networkErrorCount + rateLimitCount}`);
console.log(`  📉 失败率：${failRate}%`);
console.log(`     - PARSE_ERROR: ${parseErrorCount}`);
console.log(`     - NETWORK_ERROR: ${networkErrorCount}`);
console.log(`     - RATE_LIMITED: ${rateLimitCount}`);
console.log('');
console.log('【性能统计】');
console.log(`  ⏱️  平均响应时间：${formatTime(avgResponseTime)}`);
console.log(`  ⚡ 最快响应：${formatTime(Math.min(...responseTimes))}`);
console.log(`  🐌 最慢响应：${formatTime(Math.max(...responseTimes))}`);
console.log('');
console.log('【验收标准】');
console.log(`  ✅ 成功率 ≥95%: ${successRate >= 95 ? '通过' : '失败'}`);
console.log(`  ✅ PARSE_ERROR ≤5: ${parseErrorCount <= 5 ? '通过' : '失败'} (${parseErrorCount}次)`);
console.log(`  ✅ 平均响应 <2s: ${avgResponseTime < 2000 ? '通过' : '失败'} (${formatTime(avgResponseTime)})`);
console.log('========================================');

// 最终判定
const passed = successCount >= 95 && parseErrorCount <= 5 && avgResponseTime < 2000;

if (passed) {
  console.log('\n🎉 验收通过：所有指标达到目标值');
  process.exit(0);
} else {
  console.log('\n❌ 验收失败：部分指标未达到目标值');
  process.exit(1);
}
