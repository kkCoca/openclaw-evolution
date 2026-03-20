#!/usr/bin/env node
/**
 * DuckDuckGo Playwright Provider
 * 
 * 使用 Playwright 控制真实浏览器访问 DuckDuckGo
 * 绕过 TLS 指纹识别
 * 
 * 依赖：npm install playwright
 */

import { chromium } from 'playwright';

const BROWSER_TIMEOUT_MS = 30000;
const PAGE_TIMEOUT_MS = 15000;

async function searchWithPlaywright(query, count = 5) {
  console.log(`🔍 DuckDuckGo Playwright Search: "${query}"\n`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    // 访问 DuckDuckGo HTML 接口
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { timeout: PAGE_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
    
    // 等待搜索结果加载
    await page.waitForSelector('a[href*="/l/?uddg="], h2 a', { timeout: PAGE_TIMEOUT_MS }).catch(() => null);
    
    // 等待一小段时间确保内容加载
    await page.waitForTimeout(3000);
    
    // 截图调试
    await page.screenshot({ path: '/tmp/ddg-debug.png' }).catch(() => {});
    console.log('📸 调试截图已保存：/tmp/ddg-debug.png\n');
    
    // 获取页面 HTML 用于调试
    const html = await page.content();
    console.log(`📄 页面 HTML 长度：${html.length} 字节\n`);
    console.log('📄 页面 HTML 前 500 字符:');
    console.log(html.substring(0, 500));
    console.log('');
    
    // 检查是否有人机验证
    if (html.includes('captcha') || html.includes('challenge') || html.includes('bot')) {
      console.log('⚠️  检测到人机验证页面\n');
    }
    
    // 提取搜索结果
    const results = await page.evaluate((maxResults) => {
      // 尝试多种选择器
      const selectors = [
        'a[href*="/l/?uddg="]',
        'h2 a',
        '.result a',
      ];
      
      let elements = [];
      for (const selector of selectors) {
        elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) break;
      }
      
      const results = [];
      
      for (const element of elements.slice(0, maxResults * 2)) {
        const link = element.tagName === 'A' ? element : element.querySelector('a');
        if (!link) continue;
        
        const href = link.getAttribute('href');
        const title = link.textContent?.trim() || '';
        
        if (!href || !title || title.length < 5) continue;
        
        // 提取真实 URL
        let realUrl = href;
        if (href.includes('/l/?uddg=')) {
          const urlParams = new URLSearchParams(href.split('?')[1] || '');
          realUrl = urlParams.get('uddg');
          if (realUrl) realUrl = decodeURIComponent(realUrl);
        } else if (href.startsWith('//')) {
          realUrl = 'https:' + href;
        }
        
        if (realUrl && realUrl.startsWith('http')) {
          results.push({
            title,
            url: realUrl,
            source: 'duckduckgo-playwright',
          });
        }
        
        if (results.length >= maxResults) break;
      }
      
      return results;
    }, count);
    
    await browser.close();
    
    console.log(`✅ 成功获取 ${results.length} 条结果\n`);
    results.forEach((r, i) => {
      console.log(`[${i + 1}] ${r.title}`);
      console.log(`    ${r.url}\n`);
    });
    
    return {
      provider: 'duckduckgo-playwright',
      results,
    };
  } catch (error) {
    await browser.close().catch(() => {});
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

// 命令行测试
const query = process.argv[2] || 'OpenClaw';
const count = parseInt(process.argv[3]) || 5;

searchWithPlaywright(query, count)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
