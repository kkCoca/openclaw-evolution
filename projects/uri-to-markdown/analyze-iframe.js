const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📌 访问目标页面（直接访问，假设已有登录状态或无需登录）...');
    
    const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'target-page.png', fullPage: true });
    console.log('✅ 目标页面截图已保存：target-page.png');

    // 分析主页面
    console.log('\n📊 主页面分析...\n');
    const mainAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        textLength: document.body.innerText.length,
        hasContent: document.body.innerText.length > 100,
        iframes: window.frames.length,
        iframeSrcs: Array.from(document.querySelectorAll('iframe')).map(f => f.src || f.id || 'no-src')
      };
    });

    console.log(`📄 页面标题：${mainAnalysis.title}`);
    console.log(`🔗 页面 URL: ${mainAnalysis.url.substring(0, 150)}...`);
    console.log(`📝 文本长度：${mainAnalysis.textLength} 字符`);
    console.log(`📦 Iframe 数量：${mainAnalysis.iframes}`);
    console.log(`🔗 Iframe 源：${mainAnalysis.iframeSrcs.join(', ') || '无'}`);

    // 如果有 iframe，分析 iframe 内容
    if (mainAnalysis.iframes > 0) {
      console.log('\n📊 分析 iframe 内容...\n');
      
      for (let i = 0; i < mainAnalysis.iframes; i++) {
        try {
          const frame = page.frames()[i];
          if (!frame) continue;
          
          console.log(`\n🔍 Iframe ${i + 1}: ${frame.name() || frame.url()?.substring(0, 100)}`);
          
          const frameContent = await frame.evaluate(() => {
            const analysis = {
              title: document.title,
              textLength: document.body.innerText.length,
              preview: document.body.innerText.substring(0, 500),
              
              // 元素统计
              tables: document.querySelectorAll('table').length,
              images: document.querySelectorAll('img').length,
              links: document.querySelectorAll('a').length,
              codeBlocks: document.querySelectorAll('pre, code').length,
              
              // 检查附件
              attachments: document.querySelectorAll('[class*="attach"], [class*="file"], [class*="download"], a[href*="download"], a[href*="attach"]').length,
              attachmentLinks: Array.from(document.querySelectorAll('a[href*="download"], a[href*="attach"]')).slice(0, 10).map(a => ({
                text: a.innerText?.substring(0, 50),
                href: a.href?.substring(0, 150)
              })),
              
              // 检查元数据
              metadata: {
                title: document.querySelector('h1, h2, .title, [class*="title"]')?.innerText?.substring(0, 200),
                author: document.querySelector('[class*="author"], [class*="user"], [name*="author"]')?.innerText?.substring(0, 100),
                department: document.querySelector('[class*="dept"], [class*="org"]')?.innerText?.substring(0, 100),
                date: document.querySelector('[class*="date"], [class*="time"]')?.innerText?.substring(0, 100),
                docNumber: document.querySelector('[class*="doc"], [class*="number"]')?.innerText?.substring(0, 100)
              },
              
              // 表格详情
              tables: Array.from(document.querySelectorAll('table')).slice(0, 5).map((table, idx) => ({
                index: idx,
                rows: table.querySelectorAll('tr').length,
                preview: table.innerText?.substring(0, 200)
              })),
              
              // 主要内容区域
              mainContent: document.querySelector('#content, .content, [class*="content"], #main, .main, [role="main"]')?.innerText?.substring(0, 500),
              
              // Body classes
              bodyClasses: document.body.className?.substring(0, 200)
            };
            
            return analysis;
          });
          
          console.log(`  📄 标题：${frameContent.title}`);
          console.log(`  📝 文本长度：${frameContent.textLength} 字符`);
          console.log(`  📋 内容预览：${frameContent.preview.substring(0, 200)}...`);
          console.log(`  📊 表格：${frameContent.tables} 个`);
          console.log(`  🖼️  图片：${frameContent.images} 个`);
          console.log(`  🔗 链接：${frameContent.links} 个`);
          console.log(`  📦 附件：${frameContent.attachments} 个`);
          
          console.log(`\n  🏷️  元数据:`);
          console.log(`    - 标题：${frameContent.metadata.title || '未检测到'}`);
          console.log(`    - 作者：${frameContent.metadata.author || '未检测到'}`);
          console.log(`    - 部门：${frameContent.metadata.department || '未检测到'}`);
          console.log(`    - 日期：${frameContent.metadata.date || '未检测到'}`);
          console.log(`    - 文号：${frameContent.metadata.docNumber || '未检测到'}`);
          
          if (frameContent.tables.length > 0) {
            console.log(`\n  📊 表格详情:`);
            frameContent.tables.forEach(t => {
              console.log(`    表格 ${t.index + 1}: ${t.rows} 行`);
              console.log(`      预览：${t.preview.substring(0, 100)}...`);
            });
          }
          
          if (frameContent.attachmentLinks.length > 0) {
            console.log(`\n  📦 附件链接:`);
            frameContent.attachmentLinks.forEach((att, idx) => {
              console.log(`    ${idx + 1}. ${att.text || '无文本'} → ${att.href || '无链接'}`);
            });
          }
          
          console.log(`\n  📍 Body Classes: ${frameContent.bodyClasses || '无'}`);
          
        } catch (e) {
          console.log(`  ⚠️ Iframe ${i + 1} 分析失败：${e.message}`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ 分析完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
})();
