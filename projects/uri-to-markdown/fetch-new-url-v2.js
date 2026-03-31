const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 完整页面内容提取（新 URL - 增强等待）');
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
    
    // 等待 iframe 出现
    await page.waitForSelector('iframe', { timeout: 10000 });
    
    // 增加等待时间，确保表单完全加载
    console.log('  等待表单完全加载（20 秒）...');
    await page.waitForTimeout(20000);
    
    // 截图查看
    await page.screenshot({ path: 'new-url-screenshot.png', fullPage: true });
    console.log('  ✅ 已截图：new-url-screenshot.png\n');
    
    console.log('✅ 页面加载完成\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 分析所有 iframe
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 分析所有 iframe 内容...\n');
    
    const frames = page.frames();
    console.log(`  找到 ${frames.length} 个 Frame\n`);
    
    const allFrameData = [];
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`\n═══════════════════════════════════════════════════════════`);
      console.log(`Frame ${i + 1}/${frames.length}`);
      console.log(`  Name: ${frame.name() || '(空)'}`);
      console.log(`  URL: ${frame.url().substring(0, 150)}...`);
      console.log(`═══════════════════════════════════════════════════════════\n`);
      
      try {
        await frame.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        
        const frameData = await frame.evaluate(() => {
          const fullText = document.body.innerText;
          const fullHTML = document.documentElement.outerHTML;
          
          // 查找所有表格
          const tables = Array.from(document.querySelectorAll('table')).map((table, idx) => {
            const rows = Array.from(table.querySelectorAll('tr')).map(row => {
              const cells = Array.from(row.querySelectorAll('td, th')).map(cell => ({
                text: cell.innerText?.trim() || '',
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
          
          // 查找所有可见 div
          const divs = Array.from(document.querySelectorAll('div'))
            .filter(div => {
              const style = window.getComputedStyle(div);
              return style.display !== 'none' && div.innerText?.trim().length > 0;
            })
            .map(div => ({
              className: div.className,
              id: div.id,
              text: div.innerText?.trim().substring(0, 200)
            }));
          
          return {
            url: window.location.href,
            title: document.title,
            fullText,
            textLength: fullText.length,
            tables,
            divs: divs.slice(0, 50),
            fullHTML: fullHTML.substring(0, 100000)
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
        console.log(`  表格数：${frameData.tables.length} 个`);
        console.log(`  Div 数：${frameData.divs.length} 个`);
        
        if (frameData.textLength > 0) {
          console.log(`  文本预览：${frameData.fullText.substring(0, 200)}...\n`);
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
    console.log('\n📌 步骤 4: 保存结果...\n');
    
    // 压缩后保存
    const compressedData = allFrameData.map(f => ({
      ...f,
      data: f.data ? { ...f.data, fullHTML: f.data.fullHTML?.substring(0, 50000) } : null
    }));
    
    fs.writeFileSync('new-url-frames-full.json', JSON.stringify(compressedData, null, 2));
    console.log('✅ 完整分析已保存：new-url-frames-full.json\n');
    
    // 找到表单 Frame
    const formFrame = allFrameData.find(f => f.frameName === 'zwIframe' || f.frameUrl?.includes('cap4'));
    
    if (formFrame && formFrame.data && formFrame.data.textLength > 0) {
      console.log('✅ 找到表单 Frame，生成字段报告...\n');
      
      const formData = formFrame.data;
      const fieldPairs = [];
      
      formData.tables.forEach((table, tableIdx) => {
        if (!table.data) return;
        
        table.data.forEach((row, rowIdx) => {
          if (!row.cells) return;
          
          const cells = row.cells.map(c => c.text).filter(t => t && t.length > 0);
          
          for (let i = 0; i < cells.length - 1; i += 2) {
            const fieldName = cells[i];
            const fieldValue = cells[i + 1];
            
            if (fieldName.length > 1 && !fieldName.startsWith('1、') && !fieldName.startsWith('2、') && !fieldName.startsWith('注：')) {
              fieldPairs.push({
                table: tableIdx + 1,
                row: rowIdx + 1,
                field: fieldName,
                value: fieldValue
              });
            }
          }
        });
      });
      
      // 输出字段列表
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📋 字段提取结果');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      fieldPairs.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.field}`);
        console.log(`   └─ ${p.value || '(空)'}\n`);
      });
      
      console.log(`\n总字段数：${fieldPairs.length}\n`);
      
      fs.writeFileSync('new-url-fields.json', JSON.stringify({
        formFrameUrl: formFrame.frameUrl,
        textLength: formData.textLength,
        tablesCount: formData.tables.length,
        fieldPairs
      }, null, 2));
      console.log('✅ 字段数据已保存：new-url-fields.json\n');
    } else {
      console.log('⚠️ 表单 Frame 文本长度为 0，可能页面未完全加载\n');
      console.log('请检查截图：new-url-screenshot.png\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 新 URL 数据提取完成！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'new-url-error.png' });
  } finally {
    await browser.close();
  }
})();
