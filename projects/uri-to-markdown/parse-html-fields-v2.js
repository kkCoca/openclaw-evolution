const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 从 HTML 解析表单字段（修正配对逻辑）');
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
    // 步骤 3: 从 HTML 精确解析表单
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 从 HTML 精确解析表单字段...\n');
    
    const frames = page.frames();
    const formFrame = frames.find(f => f.name() === 'zwIframe' || f.url().includes('cap4'));
    
    if (!formFrame) {
      console.log('❌ 未找到表单 Frame\n');
      await browser.close();
      return;
    }
    
    console.log(`  ✅ 找到表单 Frame\n`);
    
    // 从 HTML 中解析表格和字段
    const formData = await formFrame.evaluate(() => {
      const fieldPairs = [];
      const sections = [];
      let currentSection = null;
      
      // 查找所有表格
      const tables = Array.from(document.querySelectorAll('table'));
      
      tables.forEach((table, tableIdx) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        
        rows.forEach((row, rowIdx) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          
          // 提取所有单元格的文本
          const cellTexts = cells.map(cell => ({
            text: cell.innerText?.trim() || '',
            className: cell.className,
            colSpan: cell.colSpan
          })).filter(c => c.text && c.text.length > 0);
          
          // 检测是否是区域标题行
          const titleCell = cellTexts.find(c => 
            c.text.includes('█') || 
            c.text.includes('上报单') || 
            (c.text.includes('信息') && c.text.length < 20) ||
            (c.text.includes('填写') && c.text.length < 20) ||
            c.text.includes('备注') ||
            c.text.includes('☆☆') ||
            c.text.includes('代码检查') ||
            c.text.includes('测试人员') ||
            c.text.includes('客开人员') ||
            c.text.includes('发起人交付')
          );
          
          if (titleCell) {
            currentSection = titleCell.text.replace(/[█☆]/g, '').trim();
            sections.push({
              table: tableIdx + 1,
              row: rowIdx + 1,
              name: currentSection
            });
            return; // 跳过标题行的字段配对
          }
          
          // 致远 OA 表单布局：字段名 | 字段值 | 字段名 | 字段值 | ...
          // 配对逻辑：偶数索引是字段名，奇数索引是字段值
          for (let i = 0; i < cellTexts.length - 1; i += 2) {
            const fieldName = cellTexts[i].text;
            const fieldValue = cellTexts[i + 1].text;
            
            // 跳过区域标题、说明文字、太短或太长的内容
            if (fieldName.length > 1 && 
                fieldName.length < 50 &&
                !fieldName.startsWith('1、') && 
                !fieldName.startsWith('2、') && 
                !fieldName.startsWith('注：') &&
                !fieldName.includes('此字段') &&
                !fieldName.includes('自动') &&
                !fieldName.includes('规范') &&
                fieldValue.length < 500 &&
                fieldName !== fieldValue &&
                // 字段名不应该是日期、时间、布尔值
                !/^\d{4}-\d{2}-\d{2}/.test(fieldName) &&
                !/^\d{2}:\d{2}/.test(fieldName) &&
                fieldName !== '是' && fieldName !== '否' &&
                fieldName !== '完成' && fieldName !== '未超期' &&
                fieldName !== '已解决' && fieldName !== '流程结束'
            ) {
              fieldPairs.push({
                table: tableIdx + 1,
                row: rowIdx + 1,
                section: currentSection,
                field: fieldName,
                value: fieldValue
              });
            }
          }
        });
      });
      
      return {
        fieldPairs,
        sections,
        tableCount: tables.length,
        url: window.location.href
      };
    });
    
    console.log(`  找到 ${formData.tableCount} 个表格`);
    console.log(`  找到 ${formData.fieldPairs.length} 个字段对`);
    console.log(`  找到 ${formData.sections.length} 个区域\n`);

    // ═══════════════════════════════════════════════════════════
    // 步骤 4: 按区域分组输出字段
    // ═══════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 字段提取结果（按区域分组）');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 按区域分组
    const groupedFields = {};
    formData.fieldPairs.forEach(p => {
      const section = p.section || '其他';
      if (!groupedFields[section]) {
        groupedFields[section] = [];
      }
      groupedFields[section].push(p);
    });
    
    // 输出每个区域的字段
    Object.entries(groupedFields).forEach(([section, fields]) => {
      console.log(`\n═══════════════════════════════════════════════════════════`);
      console.log(`📁 ${section}`);
      console.log(`═══════════════════════════════════════════════════════════\n`);
      
      fields.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.field}`);
        console.log(`   └─ ${p.value || '(空)'}\n`);
      });
    });

    // ═══════════════════════════════════════════════════════════
    // 步骤 5: 保存结果
    // ═══════════════════════════════════════════════════════════
    console.log('\n\n📌 步骤 5: 保存结果...\n');
    
    fs.writeFileSync('html-parsed-fields-v2.json', JSON.stringify(formData, null, 2));
    console.log('✅ 字段数据已保存：html-parsed-fields-v2.json\n');
    
    // 生成 Markdown 报告
    let markdown = `# 致远 OA BUG 上报单 - 表单字段提取报告\n\n`;
    markdown += `**提取时间**: ${new Date().toISOString()}\n\n`;
    markdown += `**数据来源**: ${formData.url}\n\n`;
    markdown += `**表格总数**: ${formData.tableCount}\n\n`;
    markdown += `**字段总数**: ${formData.fieldPairs.length}\n\n`;
    
    Object.entries(groupedFields).forEach(([section, fields]) => {
      markdown += `---\n\n`;
      markdown += `## ${section}\n\n`;
      markdown += `| 序号 | 字段名 | 字段值 |\n`;
      markdown += `|------|--------|--------|\n`;
      fields.forEach((p, idx) => {
        const value = p.value?.replace(/\n/g, '<br>') || '(空)';
        markdown += `| ${idx + 1} | ${p.field} | ${value} |\n`;
      });
      markdown += `\n`;
    });
    
    fs.writeFileSync('html-parsed-report-v2.md', markdown);
    console.log('✅ Markdown 报告已保存：html-parsed-report-v2.md\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ HTML 解析完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'html-parse-error.png' });
  } finally {
    await browser.close();
  }
})();
