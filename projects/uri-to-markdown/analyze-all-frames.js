const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 完整页面内容提取（所有 iframe 深度分析）');
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
    // 步骤 2: 访问目标页面
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 2: 访问目标页面...\n');
    
    const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
    
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // 等待更长时间确保所有内容加载
    console.log('  等待页面完全加载（10 秒）...');
    await page.waitForTimeout(10000);
    
    console.log('✅ 页面加载完成\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 分析所有 iframe
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 分析所有 iframe 内容...\n');
    
    const frames = page.frames();
    const allFrameData = [];
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`\n═══════════════════════════════════════════════════════════`);
      console.log(`Frame ${i + 1}/${frames.length}`);
      console.log(`  Name: ${frame.name() || '(空)'}`);
      console.log(`  URL: ${frame.url()}`);
      console.log(`═══════════════════════════════════════════════════════════\n`);
      
      try {
        // 等待 frame 加载
        await frame.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        
        const frameData = await frame.evaluate(() => {
          // 获取完整 HTML
          const fullHTML = document.documentElement.outerHTML;
          
          // 获取所有文本
          const fullText = document.body.innerText;
          
          // 获取所有可见元素
          const visibleElements = Array.from(document.querySelectorAll('*'))
            .filter(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0' &&
                     el.offsetWidth > 0 &&
                     el.offsetHeight > 0;
            })
            .map(el => ({
              tag: el.tagName,
              className: el.className,
              id: el.id,
              text: el.innerText?.trim().substring(0, 100),
              visible: true
            }));
          
          // 查找表单字段
          const formFields = Array.from(document.querySelectorAll('input, textarea, select, [class*="field"], [class*="form"], [class*="item"]'))
            .map(el => ({
              tag: el.tagName,
              type: el.type,
              name: el.name,
              id: el.id,
              className: el.className,
              value: el.value || el.innerText?.trim(),
              placeholder: el.placeholder,
              label: el.previousElementSibling?.innerText?.trim()
            }))
            .filter(el => el.value || el.label);
          
          // 查找表格
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
          
          // 查找所有链接
          const links = Array.from(document.querySelectorAll('a')).map(link => ({
            text: link.innerText?.trim() || link.textContent?.trim(),
            href: link.href || link.getAttribute('href'),
            className: link.className,
            id: link.id
          })).filter(l => l.text || l.href);
          
          // 查找所有 div（按 class 分组）
          const divs = Array.from(document.querySelectorAll('div'))
            .filter(div => {
              const style = window.getComputedStyle(div);
              return style.display !== 'none' && div.innerText?.trim().length > 0;
            })
            .map(div => ({
              id: div.id,
              className: div.className,
              text: div.innerText?.trim().substring(0, 200),
              childCount: div.children.length
            }));
          
          return {
            url: window.location.href,
            title: document.title,
            fullText,
            textLength: fullText.length,
            visibleElementsCount: visibleElements.length,
            formFields,
            tables,
            links,
            divs: divs.filter(d => d.text && d.text.length > 10),
            fullHTML
          };
        });
        
        allFrameData.push({
          frameIndex: i,
          frameName: frame.name(),
          frameUrl: frame.url(),
          data: frameData,
          error: null
        });
        
        console.log(`  标题：${frameData.title?.substring(0, 100)}...`);
        console.log(`  文本长度：${frameData.textLength} 字符`);
        console.log(`  可见元素：${frameData.visibleElementsCount} 个`);
        console.log(`  表单字段：${frameData.formFields.length} 个`);
        console.log(`  表格：${frameData.tables.length} 个`);
        console.log(`  链接：${frameData.links.length} 个`);
        console.log(`  Div 区域：${frameData.divs.length} 个`);
        
        if (frameData.formFields.length > 0) {
          console.log('\n  📝 表单字段预览:');
          frameData.formFields.slice(0, 10).forEach((f, idx) => {
            console.log(`    ${idx + 1}. [${f.tag}] ${f.name || f.id || '(无名)'}: ${f.value?.substring(0, 50) || '(空)'}`);
          });
        }
        
        if (frameData.tables.length > 0) {
          console.log('\n  📊 表格预览:');
          frameData.tables.forEach((t, idx) => {
            console.log(`    表格 ${idx + 1}: ${t.rows} 行`);
            if (t.rows > 0 && t.rows[0].cells.length > 0) {
              const firstRow = t.rows[0].cells.map(c => c.text).join(' | ').substring(0, 100);
              console.log(`      首行：${firstRow}...`);
            }
          });
        }
        
        if (frameData.divs.length > 0) {
          console.log('\n  📦 主要 Div 区域:');
          frameData.divs.slice(0, 10).forEach((d, idx) => {
            console.log(`    ${idx + 1}. [${d.className || '(无 class)'}]: ${d.text?.substring(0, 80)}...`);
          });
        }
        
      } catch (error) {
        console.log(`  ❌ 错误：${error.message}`);
        allFrameData.push({
          frameIndex: i,
          frameName: frame.name(),
          frameUrl: frame.url(),
          data: null,
          error: error.message
        });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 步骤 4: 保存结果
    // ═══════════════════════════════════════════════════════════
    console.log('\n\n📌 步骤 4: 保存结果...\n');
    
    // 压缩 HTML 后保存
    const compressedData = allFrameData.map(f => ({
      ...f,
      data: f.data ? {
        ...f.data,
        fullHTML: f.data.fullHTML?.substring(0, 100000)
      } : null
    }));
    
    fs.writeFileSync('all-frames-analysis.json', JSON.stringify(compressedData, null, 2));
    console.log('✅ 完整分析已保存：all-frames-analysis.json\n');
    
    // 生成 Markdown 报告
    let markdown = `# 致远 OA 完整页面内容分析报告\n\n`;
    markdown += `**URL**: ${targetUrl}\n\n`;
    markdown += `**分析时间**: ${new Date().toISOString()}\n\n`;
    markdown += `**Frame 总数**: ${frames.length}\n\n`;
    
    allFrameData.forEach((f, i) => {
      markdown += `---\n\n`;
      markdown += `## Frame ${i + 1}: ${f.frameName || '(无名)'}\n\n`;
      markdown += `**URL**: ${f.frameUrl}\n\n`;
      
      if (f.error) {
        markdown += `❌ 分析失败：${f.error}\n\n`;
        return;
      }
      
      const d = f.data;
      markdown += `### 概览\n\n`;
      markdown += `- **标题**: ${d.title}\n`;
      markdown += `- **文本长度**: ${d.textLength} 字符\n`;
      markdown += `- **可见元素**: ${d.visibleElementsCount} 个\n`;
      markdown += `- **表单字段**: ${d.formFields.length} 个\n`;
      markdown += `- **表格**: ${d.tables.length} 个\n`;
      markdown += `- **链接**: ${d.links.length} 个\n\n`;
      
      if (d.formFields.length > 0) {
        markdown += `### 表单字段\n\n`;
        markdown += `| 序号 | 类型 | 名称/ID | 值 |\n`;
        markdown += `|------|------|---------|-----|\n`;
        d.formFields.forEach((field, idx) => {
          markdown += `| ${idx + 1} | ${field.tag} | ${field.name || field.id || '(无)'} | ${field.value?.substring(0, 50) || '(空)'} |\n`;
        });
        markdown += `\n`;
      }
      
      if (d.tables.length > 0) {
        markdown += `### 表格\n\n`;
        d.tables.forEach((t, idx) => {
          markdown += `#### 表格 ${idx + 1}\n\n`;
          if (t.rows.length > 0 && t.rows[0].cells.length > 0) {
            const header = t.rows[0].cells.map(c => c.text).join(' | ');
            markdown += `${header}\n`;
            markdown += `${t.rows[0].cells.map(() => '---').join(' | ')}\n`;
            t.rows.slice(1, 10).forEach(row => {
              const rowText = row.cells.map(c => c.text).join(' | ');
              markdown += `${rowText}\n`;
            });
          }
          markdown += `\n`;
        });
      }
      
      if (d.links.length > 0) {
        markdown += `### 链接\n\n`;
        d.links.slice(0, 20).forEach((l, idx) => {
          markdown += `${idx + 1}. [${l.text || '(无文本)'}](${l.href || '#'})\n`;
        });
        markdown += `\n`;
      }
      
      if (d.divs.length > 0) {
        markdown += `### 主要内容区域\n\n`;
        d.divs.slice(0, 20).forEach((div, idx) => {
          markdown += `${idx + 1}. **${div.className || '(无 class)'}**\n\n`;
          markdown += `> ${div.text}\n\n`;
        });
      }
      
      markdown += `### 完整文本内容\n\n`;
      markdown += `\`\`\`\n${d.fullText}\n\`\`\`\n\n`;
    });
    
    fs.writeFileSync('complete-content-report.md', markdown);
    console.log('✅ Markdown 报告已保存：complete-content-report.md\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 完整内容分析完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();
