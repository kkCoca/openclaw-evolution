const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 登录并访问目标页面');
  console.log('═══════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    // ═══════════════════════════════════════════════════════════
    // 步骤 1: 登录
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 1: 登录致远 OA...\n');
    
    await page.goto('https://xt.seeyon.com/seeyon/main.do?method=main', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 填充用户名和密码
    await page.fill('#login_username', 'ouyp');
    await page.fill('#login_password1', 'ouyangpeng1012');
    await page.waitForTimeout(500);
    
    // 点击登录按钮
    await page.click('#login_button');
    
    // 等待页面跳转
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // 检查登录状态
    const isLoggedIn = await page.evaluate(() => {
      const title = document.title;
      return title.includes('欧阳鹏') || title.includes('您好');
    });
    
    console.log(`  登录状态：${isLoggedIn ? '✅ 成功' : '❌ 失败'}\n`);
    
    if (!isLoggedIn) {
      console.log('❌ 登录失败，终止执行\n');
      return;
    }
    
    await page.screenshot({ path: '01-logged-in.png' });
    console.log('✅ 登录后截图已保存\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 2: 访问目标页面
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 2: 访问目标页面...\n');
    
    const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
    
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: '02-target-page.png', fullPage: true });
    console.log('✅ 目标页面截图已保存：02-target-page.png\n');
    
    const currentUrl = page.url();
    console.log(`  当前 URL: ${currentUrl.substring(0, 150)}...\n`);

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 深度分析页面内容
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 分析页面内容...\n');
    
    const pageAnalysis = await page.evaluate(() => {
      // 分析主页面和所有 iframe
      const analyzeFrameContent = (doc, frameName = 'main') => {
        if (!doc) return null;
        
        // 查找所有内容区域
        const contentAreas = [
          doc.querySelector('#content'),
          doc.querySelector('.content'),
          doc.querySelector('[class*="content"]'),
          doc.querySelector('#main'),
          doc.querySelector('.main'),
          doc.querySelector('[role="main"]'),
          doc.querySelector('#detail'),
          doc.querySelector('.detail'),
          doc.body
        ].filter(el => el && el.innerText?.length > 0);
        
        const mainContent = contentAreas[0] || doc.body;
        const textContent = mainContent.innerText || '';
        
        // 表格分析
        const tables = Array.from(doc.querySelectorAll('table')).map((table, i) => ({
          index: i,
          rows: table.querySelectorAll('tr').length,
          cells: table.querySelectorAll('td, th').length,
          className: table.className?.substring(0, 100),
          id: table.id,
          text: table.innerText?.substring(0, 500)
        }));
        
        // 图片分析
        const images = Array.from(doc.querySelectorAll('img'))
          .filter(img => img.offsetParent !== null)
          .map(img => ({
            src: img.src?.substring(0, 200),
            alt: img.alt,
            className: img.className
          }));
        
        // 链接分析（特别是附件）
        const links = Array.from(doc.querySelectorAll('a'))
          .filter(link => link.innerText || link.href?.includes('download') || link.href?.includes('attach'))
          .map(link => ({
            text: link.innerText?.substring(0, 100),
            href: link.href?.substring(0, 200),
            isAttachment: link.href?.includes('download') || link.href?.includes('attach') || link.className?.includes('attach')
          }));
        
        // 元数据
        const metadata = {
          title: doc.querySelector('h1, h2, .title, [class*="title"]')?.innerText?.substring(0, 300),
          author: doc.querySelector('[class*="author"], [class*="user"], [class*="creator"]')?.innerText?.substring(0, 100),
          department: doc.querySelector('[class*="dept"], [class*="org"], [class*="department"]')?.innerText?.substring(0, 100),
          date: doc.querySelector('[class*="date"], [class*="time"]')?.innerText?.substring(0, 100),
          docNumber: doc.querySelector('[class*="doc"], [class*="number"], [class*="no"]')?.innerText?.substring(0, 100),
          status: doc.querySelector('[class*="status"], [class*="state"]')?.innerText?.substring(0, 100)
        };
        
        // 代码块
        const codeBlocks = Array.from(doc.querySelectorAll('pre, code, [class*="code"]')).map(el => ({
          tag: el.tagName,
          className: el.className,
          textLength: el.innerText?.length
        }));
        
        return {
          frameName,
          title: doc.title,
          url: doc.location?.href?.substring(0, 200),
          textLength: textContent.length,
          textPreview: textContent.substring(0, 1000),
          tables,
          images,
          links,
          attachmentLinks: links.filter(l => l.isAttachment),
          metadata,
          codeBlocks,
          bodyClasses: doc.body.className?.substring(0, 200)
        };
      };
      
      // 分析主页面
      const mainAnalysis = analyzeFrameContent(document, 'main');
      
      // 分析所有 iframe
      const iframeAnalyses = Array.from(window.frames).map((frame, i) => {
        try {
          return analyzeFrameContent(frame.document, `iframe-${i}`);
        } catch (e) {
          return { frameName: `iframe-${i}`, error: e.message };
        }
      });
      
      return {
        main: mainAnalysis,
        iframes: iframeAnalyses,
        totalFrames: window.frames.length
      };
    });

    // 输出分析结果
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 目标页面详细分析报告');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const main = pageAnalysis.main;
    
    console.log('📄 主页面:');
    console.log(`  标题：${main.title}`);
    console.log(`  文本长度：${main.textLength} 字符`);
    console.log(`  表格：${main.tables.length} 个`);
    console.log(`  图片：${main.images.length} 个`);
    console.log(`  链接：${main.links.length} 个`);
    console.log(`  附件：${main.attachmentLinks.length} 个`);
    console.log(`  代码块：${main.codeBlocks.length} 个`);
    console.log('');
    
    console.log('  🏷️  元数据:');
    console.log(`    - 标题：${main.metadata.title || '未检测到'}`);
    console.log(`    - 作者：${main.metadata.author || '未检测到'}`);
    console.log(`    - 部门：${main.metadata.department || '未检测到'}`);
    console.log(`    - 日期：${main.metadata.date || '未检测到'}`);
    console.log(`    - 文号：${main.metadata.docNumber || '未检测到'}`);
    console.log(`    - 状态：${main.metadata.status || '未检测到'}`);
    console.log('');
    
    if (main.tables.length > 0) {
      console.log('  📊 表格详情:');
      main.tables.forEach(t => {
        console.log(`    表格 ${t.index + 1}: ${t.rows}行 ${t.cells}列`);
        console.log(`      预览：${t.text.substring(0, 200)}...`);
      });
      console.log('');
    }
    
    if (main.attachmentLinks.length > 0) {
      console.log('  📦 附件链接:');
      main.attachmentLinks.forEach((att, i) => {
        console.log(`    ${i + 1}. ${att.text || '无文本'}`);
        console.log(`       href: ${att.href}`);
      });
      console.log('');
    }
    
    // Iframe 分析
    if (pageAnalysis.totalFrames > 0) {
      console.log(`📊 Iframe 分析 (共 ${pageAnalysis.totalFrames} 个):\n`);
      
      pageAnalysis.iframes.forEach((iframe, i) => {
        if (iframe.error) {
          console.log(`  ❌ Iframe ${i + 1}: ${iframe.error}\n`);
          return;
        }
        
        console.log(`  🔍 Iframe ${i + 1} (${iframe.frameName}):`);
        console.log(`    标题：${iframe.title}`);
        console.log(`    文本长度：${iframe.textLength} 字符`);
        console.log(`    表格：${iframe.tables.length} 个`);
        console.log(`    附件：${iframe.attachmentLinks.length} 个`);
        
        if (iframe.metadata.title) {
          console.log(`    元数据标题：${iframe.metadata.title.substring(0, 150)}...`);
        }
        
        if (iframe.tables.length > 0) {
          console.log(`    表格:`);
          iframe.tables.slice(0, 3).forEach(t => {
            console.log(`      - ${t.rows}行：${t.text.substring(0, 100)}...`);
          });
        }
        console.log('');
      });
    }
    
    // 内容预览
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 页面内容预览:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(main.textPreview.substring(0, 1500));
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // 保存分析结果
    fs.writeFileSync('target-page-analysis.json', JSON.stringify(pageAnalysis, null, 2));
    console.log('💾 分析结果已保存：target-page-analysis.json\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 分析完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();
