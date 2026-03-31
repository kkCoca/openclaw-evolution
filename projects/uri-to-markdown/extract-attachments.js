const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 提取附件 URL 地址');
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
    
    await page.fill('#login_username', 'ouyp');
    await page.fill('#login_password1', 'ouyangpeng1012');
    await page.waitForTimeout(500);
    await page.click('#login_button');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ 登录成功\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 2: 访问新 URL
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 2: 访问新 URL...\n');
    
    const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-7893666025191554142&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
    
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    console.log('  等待表单完全加载（20 秒）...');
    await page.waitForTimeout(20000);
    
    console.log('✅ 页面加载完成\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 提取附件 URL
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 提取附件 URL 地址...\n');
    
    const frames = page.frames();
    const formFrame = frames.find(f => f.name() === 'zwIframe' || f.url().includes('cap4'));
    
    if (!formFrame) {
      console.log('❌ 未找到表单 Frame\n');
      await browser.close();
      return;
    }
    
    // 从表单 Frame 中提取附件信息
    const attachmentsData = await formFrame.evaluate(() => {
      const attachments = [];
      
      // 查找所有附件相关元素
      const attachmentSelectors = [
        '[class*="att"]',
        '[class*="attach"]',
        '[class*="file"]',
        '[class*="attachment"]',
        'a[href*="att"]',
        'a[href*="download"]',
        'a[href*="view"]'
      ];
      
      const elements = Array.from(document.querySelectorAll(attachmentSelectors.join(',')));
      
      elements.forEach(el => {
        const text = el.innerText?.trim() || el.textContent?.trim() || '';
        const href = el.href || el.getAttribute('href') || '';
        const onClick = el.getAttribute('onclick') || '';
        const className = el.className || '';
        const tagName = el.tagName;
        
        // 查找文件名（通常是 .png, .jpg, .zip, .pdf 等）
        const fileMatch = text.match(/([^\s,]+\.(png|jpg|jpeg|gif|zip|rar|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp3|mp4))\s*\(([^)]+)\)/i);
        
        if (fileMatch || (text.length > 5 && (href || onClick))) {
          attachments.push({
            tagName,
            className,
            text,
            href,
            onClick,
            fileMatch: fileMatch ? {
              filename: fileMatch[1],
              extension: fileMatch[2],
              size: fileMatch[3]
            } : null,
            innerHTML: el.innerHTML?.substring(0, 500)
          });
        }
      });
      
      // 查找所有链接
      const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({
        text: a.innerText?.trim() || a.textContent?.trim(),
        href: a.href || a.getAttribute('href'),
        className: a.className,
        target: a.target,
        onclick: a.getAttribute('onclick')
      })).filter(l => l.text && l.text.length > 0);
      
      return {
        attachments,
        allLinks,
        fullHTML: document.documentElement.outerHTML.substring(0, 200000)
      };
    });
    
    console.log(`  找到 ${attachmentsData.attachments.length} 个附件相关元素`);
    console.log(`  找到 ${attachmentsData.allLinks.length} 个链接\n`);
    
    // 输出附件详情
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📎 附件列表（带 URL）');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (attachmentsData.attachments.length > 0) {
      attachmentsData.attachments.forEach((att, idx) => {
        console.log(`${idx + 1}. ${att.fileMatch?.filename || att.text}`);
        console.log(`   类型：${att.tagName}`);
        console.log(`   Class: ${att.className}`);
        console.log(`   Href: ${att.href || '(无)'}`);
        console.log(`   OnClick: ${att.onClick || '(无)'}`);
        if (att.fileMatch) {
          console.log(`   文件名：${att.fileMatch.filename}`);
          console.log(`   扩展名：${att.fileMatch.extension}`);
          console.log(`   大小：${att.fileMatch.size}`);
        }
        console.log('');
      });
    } else {
      console.log('  ⚠️ 未找到附件元素，可能是动态加载的\n');
    }
    
    // 输出所有链接（过滤出相关的）
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔗 所有链接（过滤后）');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const relevantLinks = attachmentsData.allLinks.filter(l => 
      l.text?.includes('.') || 
      l.text?.includes('下载') ||
      l.text?.includes('查看') ||
      l.href?.includes('att') ||
      l.href?.includes('download') ||
      l.href?.includes('view')
    );
    
    relevantLinks.forEach((l, idx) => {
      console.log(`${idx + 1}. [${l.text}]`);
      console.log(`   URL: ${l.href || '(无)'}`);
      console.log(`   Target: ${l.target || '(无)'}`);
      console.log(`   OnClick: ${l.onclick || '(无)'}\n`);
    });

    // ═══════════════════════════════════════════════════════════
    // 步骤 4: 保存结果
    // ═══════════════════════════════════════════════════════════
    console.log('\n📌 步骤 4: 保存结果...\n');
    
    fs.writeFileSync('attachments-data.json', JSON.stringify(attachmentsData, null, 2));
    console.log('✅ 附件数据已保存：attachments-data.json\n');
    
    // 生成 Markdown 报告
    let markdown = `# 致远 OA BUG 上报单 - 附件 URL 列表\n\n`;
    markdown += `**提取时间**: ${new Date().toISOString()}\n\n`;
    markdown += `**数据来源**: ${targetUrl}\n\n`;
    
    if (attachmentsData.attachments.length > 0) {
      markdown += `## 📎 附件列表\n\n`;
      markdown += `| 序号 | 文件名 | 大小 | URL | OnClick |\n`;
      markdown += `|------|--------|------|-----|---------|\n`;
      attachmentsData.attachments.forEach((att, idx) => {
        const filename = att.fileMatch?.filename || att.text || '(未知)';
        const size = att.fileMatch?.size || '(未知)';
        const url = att.href || '(无)';
        const onclick = att.onClick || '(无)';
        markdown += `| ${idx + 1} | ${filename} | ${size} | ${url} | ${onclick} |\n`;
      });
    } else {
      markdown += `## ⚠️ 说明\n\n`;
      markdown += `致远 OA 的附件下载链接是通过 JavaScript 动态生成的，无法从静态 HTML 中直接获取。\n\n`;
      markdown += `### 可能的解决方案\n\n`;
      markdown += `1. **方案 A**：模拟点击下载，拦截网络请求获取真实 URL\n`;
      markdown += `2. **方案 B**：从 Frame 2（collaboration.do）中提取附件列表（只有文件名，无 URL）\n`;
      markdown += `3. **方案 C**：在 Markdown 中标注"需手动下载"\n\n`;
    }
    
    if (relevantLinks.length > 0) {
      markdown += `\n## 🔗 相关链接\n\n`;
      markdown += `| 序号 | 文本 | URL |\n`;
      markdown += `|------|------|-----|\n`;
      relevantLinks.forEach((l, idx) => {
        markdown += `| ${idx + 1} | ${l.text} | ${l.href || '(无)'} |\n`;
      });
    }
    
    fs.writeFileSync('attachments-report.md', markdown);
    console.log('✅ Markdown 报告已保存：attachments-report.md\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 附件 URL 提取完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'attachments-error.png' });
  } finally {
    await browser.close();
  }
})();
