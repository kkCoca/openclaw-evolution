const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 完整内容提取（解决 iframe 动态加载）');
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
    // 步骤 2: 访问目标页面并等待 iframe 加载
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 2: 访问目标页面并等待 iframe 加载...\n');
    
    const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
    
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待 iframe 出现
    await page.waitForSelector('iframe', { timeout: 10000 });
    console.log('✅ 检测到 iframe\n');
    
    // 等待更长时间确保 iframe 内容完全加载
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'target-page-full.png', fullPage: true });
    console.log('✅ 截图已保存\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 获取所有 frame 并深度提取内容
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 深度提取 iframe 内容...\n');
    
    const frames = page.frames();
    console.log(`  检测到 ${frames.length} 个 frame\n`);
    
    const allContent = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      frames: []
    };
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`🔍 分析 Frame ${i + 1}: ${frame.name() || frame.url()?.substring(0, 80)}\n`);
      
      try {
        // 等待 frame 内容稳定
        await frame.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        
        const content = await frame.evaluate(() => {
          // 获取完整 HTML
          const fullHTML = document.documentElement.outerHTML;
          
          // 获取所有文本
          const fullText = document.body.innerText;
          
          // 查找标题区域
          const titleElement = document.querySelector('h1, h2, .title, [class*="title"], [id*="title"]');
          const title = titleElement?.innerText || document.title;
          
          // 查找作者/创建人信息
          const authorElement = document.querySelector('[class*="author"], [class*="user"], [class*="creator"], [name*="author"], [name*="creator"]');
          const author = authorElement?.innerText?.trim();
          
          // 查找日期信息
          const dateElement = document.querySelector('[class*="date"], [class*="time"], [name*="date"], [name*="time"]');
          const date = dateElement?.innerText?.trim();
          
          // 查找所有表格
          const tables = Array.from(document.querySelectorAll('table')).map((table, idx) => {
            const rows = Array.from(table.querySelectorAll('tr')).map(row => {
              const cells = Array.from(row.querySelectorAll('td, th')).map(cell => ({
                text: cell.innerText?.trim(),
                className: cell.className,
                colSpan: cell.colSpan,
                rowSpan: cell.rowSpan
              }));
              return { cells };
            });
            return {
              index: idx,
              id: table.id,
              className: table.className,
              rows: rows.length,
              data: rows
            };
          });
          
          // 查找所有链接（特别是附件）
          const links = Array.from(document.querySelectorAll('a')).map(link => {
            const href = link.href || link.getAttribute('href') || '';
            const text = link.innerText?.trim() || link.textContent?.trim() || '';
            const className = link.className;
            const isAttachment = href.includes('download') || href.includes('attach') || 
                                className?.includes('attach') || className?.includes('file') ||
                                text.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|png|jpg|jpeg)$/i);
            return {
              text,
              href,
              className,
              isAttachment,
              title: link.title
            };
          }).filter(link => link.text || link.isAttachment);
          
          // 查找所有图片
          const images = Array.from(document.querySelectorAll('img'))
            .filter(img => img.offsetParent !== null || img.src)
            .map(img => ({
              src: img.src,
              alt: img.alt,
              title: img.title,
              className: img.className
            }));
          
          // 查找表单/输入区域
          const forms = Array.from(document.querySelectorAll('form, textarea, input, select')).map(el => ({
            tag: el.tagName,
            type: el.type,
            name: el.name,
            id: el.id,
            className: el.className,
            value: el.value?.substring(0, 100)
          }));
          
          // 查找所有 div 区域（按 class 分组）
          const divs = Array.from(document.querySelectorAll('div')).map(div => ({
            id: div.id,
            className: div.className,
            text: div.innerText?.substring(0, 200),
            childCount: div.children.length
          })).filter(div => div.id || div.className || div.text?.length > 20);
          
          // 提取结构化数据
          const structuredData = {
            title,
            author,
            date,
            attachmentCount: links.filter(l => l.isAttachment).length
          };
          
          return {
            url: window.location.href,
            title: document.title,
            fullText,
            textLength: fullText.length,
            structuredData,
            tables,
            links,
            images,
            forms,
            divs,
            fullHTML
          };
        });
        
        allContent.frames.push({
          frameIndex: i,
          frameName: frame.name(),
          frameUrl: frame.url(),
          content: content
        });
        
        console.log(`  标题：${content.structuredData.title?.substring(0, 100)}...`);
        console.log(`  作者：${content.structuredData.author || '未检测到'}`);
        console.log(`  日期：${content.structuredData.date || '未检测到'}`);
        console.log(`  文本长度：${content.textLength} 字符`);
        console.log(`  表格：${content.tables.length} 个`);
        console.log(`  链接：${content.links.length} 个`);
        console.log(`  附件：${content.structuredData.attachmentCount} 个`);
        console.log(`  图片：${content.images.length} 个`);
        console.log('');
        
        if (content.links.filter(l => l.isAttachment).length > 0) {
          console.log('  📦 附件列表:');
          content.links.filter(l => l.isAttachment).forEach((att, idx) => {
            console.log(`    ${idx + 1}. ${att.text}`);
            console.log(`       href: ${att.href.substring(0, 150)}...`);
          });
          console.log('');
        }
        
        if (content.tables.length > 0) {
          console.log('  📊 表格详情:');
          content.tables.forEach(t => {
            console.log(`    表格 ${t.index + 1}: ${t.rows}行`);
            if (t.rows <= 10) {
              t.rows.forEach((row, ridx) => {
                const rowText = row.cells.map(c => c.text).join(' | ').substring(0, 100);
                console.log(`      行${ridx + 1}: ${rowText}...`);
              });
            }
          });
          console.log('');
        }
        
      } catch (error) {
        console.log(`  ❌ Frame ${i + 1} 提取失败：${error.message}\n`);
        allContent.frames.push({
          frameIndex: i,
          frameName: frame.name(),
          frameUrl: frame.url(),
          error: error.message
        });
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // 步骤 4: 保存结果
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 4: 保存分析结果...\n');
    
    // 保存完整 JSON（包含 HTML）
    fs.writeFileSync('full-content-analysis.json', JSON.stringify(allContent, null, 2, (key, value) => {
      // 压缩过长的 HTML
      if (key === 'fullHTML' && typeof value === 'string') {
        return value.substring(0, 50000); // 限制 HTML 长度
      }
      return value;
    }));
    console.log('✅ 完整分析已保存：full-content-analysis.json\n');
    
    // 保存简化版（只保留关键数据）
    const simplifiedContent = {
      url: allContent.url,
      timestamp: allContent.timestamp,
      frames: allContent.frames.map(f => ({
        frameName: f.frameName,
        frameUrl: f.frameUrl,
        title: f.content?.title,
        structuredData: f.content?.structuredData,
        tables: f.content?.tables?.map(t => ({
          index: t.index,
          rows: t.rows,
          preview: t.data?.slice(0, 5).map(r => r.cells.map(c => c.text).join(' | '))
        })),
        attachmentLinks: f.content?.links?.filter(l => l.isAttachment),
        allLinks: f.content?.links,
        textLength: f.content?.textLength,
        textPreview: f.content?.fullText?.substring(0, 2000)
      }))
    };
    
    fs.writeFileSync('simplified-content.json', JSON.stringify(simplifiedContent, null, 2));
    console.log('✅ 简化分析已保存：simplified-content.json\n');
    
    // 保存 Markdown 格式
    let markdown = `# 页面内容提取结果\n\n`;
    markdown += `**URL**: ${allContent.url}\n\n`;
    markdown += `**提取时间**: ${allContent.timestamp}\n\n`;
    markdown += `**Frame 数量**: ${allContent.frames.length}\n\n`;
    
    allContent.frames.forEach((f, i) => {
      if (f.error) {
        markdown += `## Frame ${i + 1}: ${f.frameName || 'unnamed'}\n\n`;
        markdown += `❌ 提取失败：${f.error}\n\n`;
        return;
      }
      
      const c = f.content;
      markdown += `## Frame ${i + 1}: ${f.frameName || 'unnamed'}\n\n`;
      markdown += `### 元数据\n\n`;
      markdown += `- **标题**: ${c.structuredData.title || 'N/A'}\n`;
      markdown += `- **作者**: ${c.structuredData.author || 'N/A'}\n`;
      markdown += `- **日期**: ${c.structuredData.date || 'N/A'}\n`;
      markdown += `- **附件数**: ${c.structuredData.attachmentCount}\n`;
      markdown += `- **文本长度**: ${c.textLength} 字符\n\n`;
      
      if (c.structuredData.attachmentCount > 0) {
        markdown += `### 附件列表\n\n`;
        c.links.filter(l => l.isAttachment).forEach((att, idx) => {
          markdown += `${idx + 1}. [${att.text}](${att.href})\n`;
        });
        markdown += `\n`;
      }
      
      if (c.tables.length > 0) {
        markdown += `### 表格\n\n`;
        c.tables.forEach(t => {
          markdown += `#### 表格 ${t.index + 1}\n\n`;
          if (t.rows.length > 0 && t.rows[0].cells.length > 0) {
            // 表头
            const headers = t.rows[0].cells.map(c => c.text).join(' | ');
            markdown += `${headers}\n`;
            markdown += `${t.rows[0].cells.map(() => '---').join(' | ')}\n`;
            // 数据行
            t.rows.slice(1).forEach(row => {
              const rowText = row.cells.map(c => c.text).join(' | ');
              markdown += `${rowText}\n`;
            });
          }
          markdown += `\n`;
        });
      }
      
      markdown += `### 正文内容\n\n`;
      markdown += `${c.fullText?.substring(0, 5000) || '无内容'}\n\n`;
      markdown += `---\n\n`;
    });
    
    fs.writeFileSync('extracted-content.md', markdown);
    console.log('✅ Markdown 已保存：extracted-content.md\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 内容提取完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();
