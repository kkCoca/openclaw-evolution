#!/usr/bin/env node
/**
 * DuckDuckGo Provider 测试脚本
 * 用法：node test-ddg.js "搜索关键词" [结果数量]
 */

import { DuckDuckGoSearchProvider } from './dist/src/index.js';

const query = process.argv[2] || 'OpenClaw gateway';
const count = parseInt(process.argv[3]) || 3;

console.log(`🔍 DuckDuckGo Search: "${query}" (count: ${count})\n`);

const provider = new DuckDuckGoSearchProvider();

try {
  const result = await provider.search({ query, count });
  
  console.log(`✅ Provider: ${result.provider}`);
  console.log(`📊 Results: ${result.results.length}\n`);
  
  result.results.forEach((r, i) => {
    console.log(`[${i + 1}] ${r.title}`);
    console.log(`    ${r.url}`);
    console.log(`    ${r.snippet}\n`);
  });
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
