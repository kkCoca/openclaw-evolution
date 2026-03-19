#!/usr/bin/env node
/**
 * DuckDuckGo Provider 调试脚本
 */

import { DefaultDuckDuckGoClient } from './dist/src/ddg-client.js';

const query = process.argv[2] || 'OpenClaw gateway';

console.log(`🔍 Debug: DuckDuckGo Client Test - "${query}"\n`);

const client = new DefaultDuckDuckGoClient({
  timeoutMs: 15000,
  maxRetries: 1, // 只重试一次以便快速看到错误
});

try {
  const html = await client.searchHtml({
    query,
    country: null,
    language: null,
    cacheKey: 'test',
    requestTimestamp: Date.now(),
  });
  
  console.log(`✅ Success! HTML length: ${html.length}`);
  console.log(html.substring(0, 500) + '...\n');
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  if (error.cause) {
    console.error(`   Cause: ${error.cause}`);
  }
  console.error(`   Stack: ${error.stack}`);
  process.exit(1);
}
