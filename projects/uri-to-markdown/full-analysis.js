const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 URI to Markdown - 致远 OA 页面自动化分析');
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
  
  // 启用请求/响应日志
  page.on('response', response => {
    const url = response.url();
    if (url.includes('seeyon.com') && !url.includes('.js') && !url.includes('.css') && !url.includes('.png')) {
      console.log(`📡 [${response.status()}] ${url.substring(0, 100)}`);
    }
  });

  try {
    // ═══════════════════════════════════════════════════════════
    // 步骤 1: 分析登录页面结构
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 1: 分析登录页面结构...\n');
    
    await page.goto('https://xt.seeyon.com/seeyon/main.do?method=main', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.screenshot({ path: '01-login-page.png', fullPage: true });
    console.log('✅ 登录页面截图：01-login-page.png\n');

    // 深度分析登录表单
    const loginStructure = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        className: input.className,
        value: input.value?.substring(0, 50),
        placeholder: input.placeholder,
        visible: input.offsetParent !== null,
        disabled: input.disabled
      }));
      
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(btn => ({
        tag: btn.tagName,
        type: btn.type,
        id: btn.id,
        className: btn.className,
        text: btn.innerText?.substring(0, 50),
        value: btn.value?.substring(0, 50),
        visible: btn.offsetParent !== null
      }));
      
      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        id: form.id,
        className: form.className,
        action: form.action,
        method: form.method,
        inputCount: form.querySelectorAll('input').length
      }));
      
      // 查找可能的登录相关元素
      const loginHints = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.innerText?.toLowerCase();
        return text && (text.includes('登录') || text.includes('login') || text.includes('账号') || text.includes('密码'));
      }).slice(0, 20).map(el => ({
        tag: el.tagName,
        className: el.className,
        id: el.id,
        text: el.innerText?.substring(0, 100)
      }));
      
      return {
        title: document.title,
        url: window.location.href,
        inputs,
        buttons,
        forms,
        loginHints,
        bodyClasses: document.body.className,
        pageContent: document.body.innerText.substring(0, 500)
      };
    });

    console.log('📊 登录页面结构分析:');
    console.log(`  页面标题：${loginStructure.title}`);
    console.log(`  页面 URL: ${loginStructure.url.substring(0, 100)}`);
    console.log(`  表单数量：${loginStructure.forms.length}`);
    console.log(`  输入框数量：${loginStructure.inputs.length}`);
    console.log(`  按钮数量：${loginStructure.buttons.length}`);
    console.log('');
    
    console.log('📝 表单详情:');
    loginStructure.forms.forEach((form, i) => {
      console.log(`  表单 ${i + 1}: id="${form.id}", class="${form.className}", inputs=${form.inputCount}`);
      console.log(`    action: ${form.action.substring(0, 100)}`);
      console.log(`    method: ${form.method}`);
    });
    console.log('');
    
    console.log('📝 输入框详情:');
    loginStructure.inputs.forEach((input, i) => {
      console.log(`  ${i + 1}. type="${input.type}", name="${input.name}", id="${input.id}", visible=${input.visible}`);
    });
    console.log('');
    
    console.log('📝 按钮详情:');
    loginStructure.buttons.forEach((btn, i) => {
      console.log(`  ${i + 1}. ${btn.tag} type="${btn.type}", text="${btn.text}", visible=${btn.visible}`);
    });
    console.log('');
    
    console.log('📝 登录相关提示:');
    loginStructure.loginHints.forEach((hint, i) => {
      console.log(`  ${i + 1}. <${hint.tag}> "${hint.text}"`);
    });
    console.log('');

    // ═══════════════════════════════════════════════════════════
    // 步骤 2: 尝试多种登录策略
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 2: 尝试自动登录...\n');
    
    const credentials = {
      username: 'ouyp',
      password: 'ouyangpeng1012'
    };
    
    // 策略 1: 直接填充可见的用户名/密码字段
    let loginSuccess = false;
    
    try {
      // 查找用户名输入框（排除隐藏字段）
      const usernameSelector = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"]'));
        const visibleInput = inputs.find(input => input.offsetParent !== null && !input.name.includes('hidden'));
        return visibleInput ? `[name="${visibleInput.name}"]` : null;
      });
      
      if (usernameSelector) {
        console.log(`✅ 找到可见用户名输入框：${usernameSelector}`);
        await page.fill(usernameSelector, credentials.username);
        
        // 查找密码输入框
        const passwordSelector = 'input[type="password"]';
        const passwordInput = await page.$(passwordSelector);
        if (passwordInput) {
          console.log(`✅ 找到密码输入框：${passwordSelector}`);
          await page.fill(passwordSelector, credentials.password);
          
          // 查找提交按钮
          const submitBtn = await page.$('input[type="submit"], button[type="submit"], button[class*="login"], button[class*="submit"]');
          if (submitBtn) {
            console.log(`✅ 找到提交按钮，点击登录...`);
            await submitBtn.click();
            
            // 等待导航
            try {
              await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
              loginSuccess = true;
              console.log('✅ 登录成功！\n');
            } catch (e) {
              console.log('⚠️ 登录后等待超时，可能页面未跳转\n');
            }
          } else {
            console.log('⚠️ 未找到提交按钮\n');
          }
        } else {
          console.log('⚠️ 未找到密码输入框\n');
        }
      } else {
        console.log('⚠️ 未找到可见的用户名输入框\n');
      }
    } catch (e) {
      console.log(`⚠️ 登录策略 1 失败：${e.message}\n`);
    }

    // 截图登录后的状态
    await page.screenshot({ path: '02-after-login-attempt.png', fullPage: true });
    console.log('✅ 登录后截图：02-after-login-attempt.png\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 访问目标页面
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 访问目标页面...\n');
    
    const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
    
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.screenshot({ path: '03-target-page.png', fullPage: true });
    console.log('✅ 目标页面截图：03-target-page.png\n');

    // 检查是否被重定向到登录页
    const currentUrl = page.url();
    if (currentUrl.includes('main.do')) {
      console.log('⚠️ 检测到被重定向到登录页，说明需要登录才能访问目标页面\n');
      console.log(`  当前 URL: ${currentUrl}\n`);
    } else {
      console.log('✅ 成功访问目标页面\n');
    }

    // ═══════════════════════════════════════════════════════════
    // 步骤 4: 深度分析目标页面（包括所有 iframe）
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 4: 深度分析目标页面结构...\n');
    
    const pageAnalysis = await page.evaluate(() => {
      // 分析主页面和所有 iframe
      const analyzeFrame = (frameDoc, frameName = 'main') => {
        if (!frameDoc) return null;
        
        // 查找主要内容区域
        const mainContent = frameDoc.querySelector('#content, .content, [class*="content"], #main, .main, [role="main"], #detail, .detail') 
          || frameDoc.body;
        
        // 提取文本内容
        const textContent = mainContent.innerText || '';
        
        // 分析表格
        const tables = Array.from(frameDoc.querySelectorAll('table')).map((table, i) => {
          const rows = table.querySelectorAll('tr');
          const cells = table.querySelectorAll('td, th');
          return {
            index: i,
            rows: rows.length,
            cells: cells.length,
            className: table.className,
            id: table.id,
            preview: table.innerText?.substring(0, 300)
          };
        });
        
        // 分析图片
        const images = Array.from(frameDoc.querySelectorAll('img')).map(img => ({
          src: img.src?.substring(0, 150),
          alt: img.alt,
          className: img.className,
          visible: img.offsetParent !== null
        }));
        
        // 分析链接（特别是附件相关）
        const links = Array.from(frameDoc.querySelectorAll('a')).map(link => ({
          text: link.innerText?.substring(0, 100),
          href: link.href?.substring(0, 150),
          className: link.className,
          isAttachment: link.href?.includes('download') || link.href?.includes('attach') || 
                       link.className?.includes('attach') || link.className?.includes('file')
        }));
        
        // 分析元数据
        const metadata = {
          title: frameDoc.querySelector('h1, h2, .title, [class*="title"]')?.innerText?.substring(0, 200),
          author: frameDoc.querySelector('[class*="author"], [class*="user"], [name*="author"], [class*="creator"]')?.innerText?.substring(0, 100),
          department: frameDoc.querySelector('[class*="dept"], [class*="org"], [class*="department"]')?.innerText?.substring(0, 100),
          date: frameDoc.querySelector('[class*="date"], [class*="time"], [name*="date"]')?.innerText?.substring(0, 100),
          docNumber: frameDoc.querySelector('[class*="doc"], [class*="number"], [class*="no"]')?.innerText?.substring(0, 100),
          status: frameDoc.querySelector('[class*="status"], [class*="state"]')?.innerText?.substring(0, 100)
        };
        
        // 检查代码块
        const codeBlocks = Array.from(frameDoc.querySelectorAll('pre, code, [class*="code"]')).map(el => ({
          tag: el.tagName,
          className: el.className,
          textLength: el.innerText?.length
        }));
        
        // 检查表单/输入区域
        const forms = Array.from(frameDoc.querySelectorAll('form, textarea, input[type="text"]')).map(el => ({
          tag: el.tagName,
          type: el.type,
          className: el.className
        }));
        
        return {
          frameName,
          title: frameDoc.title,
          url: frameDoc.location?.href?.substring(0, 150),
          textLength: textContent.length,
          textPreview: textContent.substring(0, 500),
          tables,
          images: images.filter(img => img.visible),
          links: links.filter(link => link.text || link.isAttachment),
          attachmentLinks: links.filter(link => link.isAttachment),
          metadata,
          codeBlocks,
          forms,
          bodyClasses: frameDoc.body.className
        };
      };
      
      // 分析主页面
      const mainAnalysis = analyzeFrame(document, 'main');
      
      // 分析所有 iframe
      const iframeAnalyses = Array.from(window.frames).map((frame, i) => {
        try {
          return analyzeFrame(frame.document, `iframe-${i}`);
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
    
    // 主页面分析
    const main = pageAnalysis.main;
    console.log('📄 主页面分析:');
    console.log(`  标题：${main.title}`);
    console.log(`  URL: ${main.url}`);
    console.log(`  文本长度：${main.textLength} 字符`);
    console.log(`  表格数量：${main.tables.length}`);
    console.log(`  图片数量：${main.images.length}`);
    console.log(`  链接数量：${main.links.length}`);
    console.log(`  附件链接：${main.attachmentLinks.length}`);
    console.log(`  代码块：${main.codeBlocks.length}`);
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
        console.log(`      class="${t.className}", id="${t.id}"`);
        console.log(`      预览：${t.preview.substring(0, 150)}...`);
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
    
    if (main.images.length > 0) {
      console.log('  🖼️  可见图片:');
      main.images.slice(0, 10).forEach((img, i) => {
        console.log(`    ${i + 1}. src: ${img.src.substring(0, 100)}...`);
        console.log(`       alt: ${img.alt || '无'}`);
      });
      console.log('');
    }
    
    console.log(`  📍 Body Classes: ${main.bodyClasses}`);
    console.log('');
    
    // Iframe 分析
    if (pageAnalysis.totalFrames > 0) {
      console.log(`📊 Iframe 分析 (共 ${pageAnalysis.totalFrames} 个):\n`);
      
      pageAnalysis.iframes.forEach((iframe, i) => {
        if (iframe.error) {
          console.log(`  ❌ Iframe ${i + 1} (${iframe.frameName}): 无法访问 - ${iframe.error}\n`);
          return;
        }
        
        console.log(`  🔍 Iframe ${i + 1} (${iframe.frameName}):`);
        console.log(`    标题：${iframe.title}`);
        console.log(`    文本长度：${iframe.textLength} 字符`);
        console.log(`    表格：${iframe.tables.length} 个`);
        console.log(`    图片：${iframe.images.length} 个`);
        console.log(`    附件：${iframe.attachmentLinks.length} 个`);
        
        if (iframe.metadata.title) {
          console.log(`    元数据标题：${iframe.metadata.title.substring(0, 100)}...`);
        }
        
        if (iframe.tables.length > 0) {
          console.log(`    表格预览:`);
          iframe.tables.slice(0, 2).forEach(t => {
            console.log(`      - ${t.rows}行 ${t.cells}列: ${t.preview.substring(0, 100)}...`);
          });
        }
        
        console.log('');
      });
    }
    
    // 内容预览
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 页面内容预览（前 1000 字符）:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(main.textPreview.substring(0, 1000));
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 5: 生成分析总结
    // ═══════════════════════════════════════════════════════════
    console.log('📊 分析总结:\n');
    
    const summary = {
      pageType: '未知',
      hasContent: main.textLength > 100,
      hasTables: main.tables.length > 0 || pageAnalysis.iframes.some(iframe => iframe.tables?.length > 0),
      hasImages: main.images.length > 0 || pageAnalysis.iframes.some(iframe => iframe.images?.length > 0),
      hasAttachments: main.attachmentLinks.length > 0 || pageAnalysis.iframes.some(iframe => iframe.attachmentLinks?.length > 0),
      hasCodeBlocks: main.codeBlocks.length > 0,
      hasMetadata: Object.values(main.metadata).some(v => v),
      needsLogin: currentUrl.includes('main.do'),
      iframeCount: pageAnalysis.totalFrames
    };
    
    // 判断页面类型
    if (main.metadata.status) {
      summary.pageType = 'BUG 单/工单页';
    } else if (main.tables.length > 2) {
      summary.pageType = '报表/数据页';
    } else if (main.textLength > 500) {
      summary.pageType = '文档/文章页';
    } else {
      summary.pageType = '主页/导航页';
    }
    
    console.log('  页面类型:', summary.pageType);
    console.log('  需要登录:', summary.needsLogin ? '✅ 是' : '❌ 否');
    console.log('  有内容:', summary.hasContent ? '✅ 是' : '❌ 否');
    console.log('  有表格:', summary.hasTables ? '✅ 是' : '❌ 否');
    console.log('  有图片:', summary.hasImages ? '✅ 是' : '❌ 否');
    console.log('  有附件:', summary.hasAttachments ? '✅ 是' : '❌ 否');
    console.log('  有代码块:', summary.hasCodeBlocks ? '✅ 是' : '❌ 否');
    console.log('  有元数据:', summary.hasMetadata ? '✅ 是' : '❌ 否');
    console.log('  Iframe 数量:', summary.iframeCount);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 分析完成！');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 保存分析结果为 JSON
    fs.writeFileSync('page-analysis.json', JSON.stringify({
      loginStructure,
      pageAnalysis,
      summary,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log('💾 分析结果已保存：page-analysis.json\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('💾 错误截图已保存：error-screenshot.png');
  } finally {
    await browser.close();
    console.log('\n👋 浏览器已关闭\n');
  }
})();
