#!/usr/bin/env node
/**
 * DuckDuckGo Browser Provider
 * 
 * 使用 OpenClaw browser 工具访问 DuckDuckGo
 * 绕过 TLS 指纹识别
 * 
 * 这是方案 A 的最终实现
 */

// 注意：这个脚本需要在 OpenClaw 环境中运行
// 它使用 OpenClaw 的 browser 工具

async function searchWithBrowser(query, count = 5) {
  console.log(`🔍 DuckDuckGo Browser Search: "${query}" (count: ${count})\n`);
  
  const startTime = Date.now();
  
  try {
    // 使用 browser 工具访问 DuckDuckGo
    const browserResult = await browserAction({
      action: 'open',
      targetUrl: `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    });
    
    console.log(`📄 页面已打开，等待加载...`);
    
    // 等待页面加载
    await sleep(3000);
    
    // 获取页面快照
    const snapshot = await browserAction({
      action: 'snapshot',
      targetId: browserResult.targetId,
    });
    
    // 从快照中提取搜索结果
    const results = extractResultsFromSnapshot(snapshot, count);
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Browser 访问成功 (${formatTime(responseTime)})`);
    console.log(`📊 Results: ${results.length}\n`);
    
    if (results.length === 0) {
      console.log('⚠️  未找到搜索结果，可能遇到人机验证页面\n');
    }
    
    results.forEach((r, i) => {
      console.log(`[${i + 1}] ${r.title}`);
      console.log(`    ${r.url}\n`);
    });
    
    // 关闭浏览器标签页
    await browserAction({
      action: 'close',
      targetId: browserResult.targetId,
    });
    
    return {
      provider: 'duckduckgo-browser',
      results,
      responseTime,
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

function extractResultsFromSnapshot(snapshot, count) {
  // 从 browser snapshot 中提取搜索结果
  // snapshot 包含页面的结构化数据
  
  const results = [];
  
  // 查找所有链接（格式：//duckduckgo.com/l/?uddg=REAL_URL）
  if (snapshot && snapshot.refs) {
    for (const ref of Object.values(snapshot.refs)) {
      if (ref.type === 'link' && ref.url && ref.url.includes('/l/?uddg=')) {
        // 提取真实 URL
        const urlParams = new URLSearchParams(ref.url.split('?')[1] || '');
        const realUrl = urlParams.get('uddg');
        
        if (realUrl) {
          const title = ref.text || ref.label || '';
          
          if (title && title.length > 5) {
            results.push({
              title: title.trim(),
              url: decodeURIComponent(realUrl),
              snippet: '',
              source: 'duckduckgo-browser',
            });
            
            if (results.length >= count) {
              break;
            }
          }
        }
      }
    }
  }
  
  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// 导出给其他模块使用
export { searchWithBrowser };

// 命令行测试（如果在 OpenClaw 环境中运行）
if (typeof process !== 'undefined' && process.argv) {
  const query = process.argv[2] || 'OpenClaw';
  const count = parseInt(process.argv[3]) || 5;
  
  searchWithBrowser(query, count)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
