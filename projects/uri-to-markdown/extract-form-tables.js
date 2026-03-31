const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 提取表单表达区（表格结构）');
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
    
    console.log('  等待页面完全加载（10 秒）...');
    await page.waitForTimeout(10000);
    
    console.log('✅ 页面加载完成\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 定位 Frame 4 (zwIframe) - 表单表达区
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 定位表单表达区（Frame 4: zwIframe）...\n');
    
    const frames = page.frames();
    const formFrame = frames.find(f => f.name() === 'zwIframe' || f.url().includes('cap4/template/display'));
    
    if (!formFrame) {
      console.log('❌ 未找到表单 Frame\n');
      await browser.close();
      return;
    }
    
    console.log(`  ✅ 找到表单 Frame: ${formFrame.url().substring(0, 100)}...\n`);

    // ═══════════════════════════════════════════════════════════
    // 步骤 4: 提取表单表达区的表格结构
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 4: 提取表单表达区（表格结构）...\n');
    
    const formData = await formFrame.evaluate(() => {
      // 查找所有表格
      const tables = Array.from(document.querySelectorAll('table'));
      console.log(`找到 ${tables.length} 个表格`);
      
      const tableData = tables.map((table, tableIdx) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        const rowData = rows.map((row, rowIdx) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const cellData = cells.map((cell, cellIdx) => {
            // 获取单元格的完整信息
            const style = window.getComputedStyle(cell);
            const backgroundColor = style.backgroundColor;
            const fontWeight = style.fontWeight;
            const textAlign = style.textAlign;
            
            // 判断是否是表头（蓝色背景或粗体）
            const isHeader = backgroundColor.includes('77') || 
                            backgroundColor.includes('123') || 
                            fontWeight === 'bold' ||
                            cell.tagName === 'TH';
            
            return {
              text: cell.innerText?.trim() || '',
              html: cell.innerHTML?.substring(0, 500) || '',
              colSpan: cell.colSpan,
              rowSpan: cell.rowSpan,
              className: cell.className,
              isHeader,
              backgroundColor,
              width: cell.offsetWidth,
              height: cell.offsetHeight
            };
          });
          return {
            cells: cellData,
            className: row.className,
            cellCount: cellData.length
          };
        });
        
        return {
          tableIndex: tableIdx,
          id: table.id,
          className: table.className,
          rows: rowData,
          rowCount: rowData.length,
          maxColumns: Math.max(...rowData.map(r => r.cellCount)),
          tableHTML: table.outerHTML.substring(0, 5000)
        };
      });
      
      // 查找表单区域（表达区）
      const formSections = Array.from(document.querySelectorAll('[class*="form"], [class*="section"], [class*="area"], [class*="content"]'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && el.offsetHeight > 0;
        })
        .map(el => ({
          id: el.id,
          className: el.className,
          tagName: el.tagName,
          text: el.innerText?.substring(0, 200),
          childCount: el.children.length,
          tableCount: el.querySelectorAll('table').length
        }));
      
      // 查找所有带 label 的字段
      const fields = Array.from(document.querySelectorAll('[class*="field"], [class*="item"], [class*="label"]'))
        .filter(el => el.innerText?.trim().length > 0)
        .map(el => ({
          id: el.id,
          className: el.className,
          tagName: el.tagName,
          label: el.innerText?.trim().substring(0, 100),
          value: el.querySelector('input, textarea, select')?.value || 
                 el.nextElementSibling?.innerText?.trim() ||
                 '(无值)'
        }));
      
      return {
        tables: tableData,
        formSections,
        fields: fields.slice(0, 100),
        fullHTML: document.documentElement.outerHTML
      };
    });
    
    console.log(`  找到 ${formData.tables.length} 个表格\n`);
    
    // 输出表格详情
    formData.tables.forEach((t, idx) => {
      console.log(`\n═══════════════════════════════════════════════════════════`);
      console.log(`表格 ${idx + 1}/${formData.tables.length}`);
      console.log(`  Class: ${t.className || '(无)'}`);
      console.log(`  ID: ${t.id || '(无)'}`);
      console.log(`  行数：${t.rowCount}`);
      console.log(`  列数：${t.maxColumns}`);
      console.log(`═══════════════════════════════════════════════════════════\n`);
      
      if (t.rows.length > 0) {
        console.log('  前 3 行预览:\n');
        t.rows.slice(0, 3).forEach((row, rowIdx) => {
          const rowText = row.cells.map(c => c.text).join(' | ');
          console.log(`    行${rowIdx + 1}: ${rowText.substring(0, 150)}...`);
        });
        console.log('');
      }
    });

    // ═══════════════════════════════════════════════════════════
    // 步骤 5: 保存结果
    // ═══════════════════════════════════════════════════════════
    console.log('\n📌 步骤 5: 保存结果...\n');
    
    // 保存表格数据（压缩 HTML）
    const compressedData = {
      tables: formData.tables.map(t => ({
        ...t,
        tableHTML: t.tableHTML.substring(0, 10000)
      })),
      formSections: formData.formSections,
      fields: formData.fields
    };
    
    fs.writeFileSync('form-tables.json', JSON.stringify(compressedData, null, 2));
    console.log('✅ 表格数据已保存：form-tables.json\n');
    
    // 生成 Markdown 表格报告
    let markdown = `# 致远 OA 表单表达区（表格结构）\n\n`;
    markdown += `**URL**: ${targetUrl}\n\n`;
    markdown += `**分析时间**: ${new Date().toISOString()}\n\n`;
    markdown += `**表格总数**: ${formData.tables.length}\n\n`;
    
    formData.tables.forEach((t, idx) => {
      markdown += `---\n\n`;
      markdown += `## 表格 ${idx + 1}\n\n`;
      markdown += `**Class**: \`${t.className || '(无)'}\`\n\n`;
      markdown += `**ID**: \`${t.id || '(无)'}\`\n\n`;
      markdown += `**尺寸**: ${t.rowCount} 行 × ${t.maxColumns} 列\n\n`;
      
      if (t.rows.length > 0) {
        markdown += `### 表格内容\n\n`;
        
        // 尝试渲染为 Markdown 表格
        if (t.maxColumns <= 10) {
          t.rows.forEach((row, rowIdx) => {
            const cells = row.cells.map(c => c.text || '').join(' | ');
            markdown += `${cells}\n`;
            if (rowIdx === 0) {
              markdown += row.cells.map(() => '---').join(' | ') + '\n';
            }
          });
          markdown += `\n`;
        }
        
        // 输出前 5 行详情
        markdown += `### 单元格详情\n\n`;
        t.rows.slice(0, 5).forEach((row, rowIdx) => {
          markdown += `**行 ${rowIdx + 1}**:\n\n`;
          row.cells.forEach((cell, cellIdx) => {
            markdown += `- 列${cellIdx + 1}: \`${cell.text || '(空)'}\` ${cell.isHeader ? '**【表头】**' : ''}\n`;
          });
          markdown += `\n`;
        });
      }
      
      markdown += `\n`;
    });
    
    // 表单区域
    if (formData.formSections.length > 0) {
      markdown += `---\n\n`;
      markdown += `## 表单区域\n\n`;
      formData.formSections.slice(0, 20).forEach((s, idx) => {
        markdown += `${idx + 1}. **${s.className || '(无 class)'}** (${s.tagName})\n`;
        markdown += `   - 子元素：${s.childCount} 个，表格：${s.tableCount} 个\n`;
        markdown += `   - 内容：${s.text?.substring(0, 100)}...\n\n`;
      });
    }
    
    fs.writeFileSync('form-tables-report.md', markdown);
    console.log('✅ Markdown 报告已保存：form-tables-report.md\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 表单表达区提取完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'form-extract-error.png' });
  } finally {
    await browser.close();
  }
})();
