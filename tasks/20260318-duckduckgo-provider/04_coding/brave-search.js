#!/usr/bin/env node
/**
 * Brave Search Provider - 免 API Key 的 DuckDuckGo 替代方案
 * 
 * Brave Search 特点：
 * - 独立索引（不依赖 Google/Bing）
 * - 隐私保护
 * - 免 API Key（通过 HTML 接口）
 * - 反爬较宽松
 */

import { load } from 'cheerio';

async function braveSearch(query, count = 5) {
  console.log(`🔍 Brave Search: "${query}"\n`);
  
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Brave Search 结果选择器
    const results = [];
    $('.snippet').each((_, element) => {
      if (results.length >= count) return false;
      
      const title = $(element).find('.title').text().trim();
      const url = $(element).find('.title').attr('href');
      const snippet = $(element).find('.snippet-description').text().trim();
      
      if (title && url) {
        results.push({
          title,
          url,
          snippet: snippet || title,
          source: 'brave',
        });
      }
    });
    
    console.log(`✅ 成功获取 ${results.length} 条结果\n`);
    results.forEach((r, i) => {
      console.log(`[${i + 1}] ${r.title}`);
      console.log(`    ${r.url}`);
      console.log(`    ${r.snippet}\n`);
    });
    
    return {
      provider: 'brave',
      results,
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

// 命令行测试
const query = process.argv[2] || 'OpenClaw';
const count = parseInt(process.argv[3]) || 5;

braveSearch(query, count)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
