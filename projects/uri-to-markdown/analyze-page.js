const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 步骤 1: 打开登录页面
    console.log('📌 步骤 1: 打开登录页面...');
    await page.goto('https://xt.seeyon.com/seeyon/main.do?method=main', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '01-login-page.png' });
    console.log('✅ 登录页面截图已保存：01-login-page.png');

    // 尝试自动登录
    console.log('📌 步骤 1b: 尝试自动登录...');
    
    // 查找登录表单元素
    const loginForm = await page.evaluate(() => {
      const form = document.querySelector('form');
      const usernameInput = document.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[name*="account"], input[name*="username"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitBtn = document.querySelector('input[type="submit"], button[type="submit"], button[class*="login"], input[value*="登录"], input[value*="login"]');
      
      return {
        formId: form?.id || form?.className,
        usernameName: usernameInput?.name,
        passwordName: passwordInput?.name,
        submitId: submitBtn?.id || submitBtn?.className,
        hasForm: !!form,
        hasUsername: !!usernameInput,
        hasPassword: !!passwordInput,
        hasSubmit: !!submitBtn
      };
    });
    
    console.log('🔐 登录表单分析:');
    console.log(`  - Form: ${loginForm.formId || '未检测到'}`);
    console.log(`  - 用户名字段：${loginForm.usernameName || '未检测到'}`);
    console.log(`  - 密码字段：${loginForm.passwordName || '未检测到'}`);
    console.log(`  - 提交按钮：${loginForm.submitId || '未检测到'}`);
    
    if (loginForm.hasForm && loginForm.hasUsername && loginForm.hasPassword && loginForm.hasSubmit) {
      console.log('✅ 检测到完整登录表单，尝试自动登录...');
      
      // 尝试自动填写并提交
      try {
        if (loginForm.usernameName) {
          await page.fill(`[name="${loginForm.usernameName}"]`, 'ouyp');
        }
        if (loginForm.passwordName) {
          await page.fill(`[name="${loginForm.passwordName}"]`, 'ouyangpeng1012');
        }
        await page.click(`#${loginForm.submitId}, [class*="${loginForm.submitId}"]`);
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
        console.log('✅ 已提交登录表单');
        
        await page.screenshot({ path: '02-after-login.png' });
        console.log('✅ 登录后截图已保存：02-after-login.png');
      } catch (e) {
        console.log('⚠️ 自动登录失败:', e.message);
        console.log('⏳ 继续尝试访问目标页面（可能需要手动登录）...');
      }
    } else {
      console.log('⚠️ 未检测到完整登录表单，可能需要特殊登录方式');
    }

    console.log('✅ 检测到登录状态变化');
    await page.screenshot({ path: '02-after-login.png' });
    console.log('✅ 登录后截图已保存：02-after-login.png');

    // 步骤 2: 访问目标页面
    console.log('📌 步骤 2: 访问目标页面...');
    const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '03-target-page.png', fullPage: true });
    console.log('✅ 目标页面截图已保存：03-target-page.png');

    // 步骤 3: 分析页面结构
    console.log('\n📊 步骤 3: 分析页面结构...\n');

    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        title: document.title,
        url: window.location.href,
        
        // 检查元素类型
        hasText: document.body.innerText.length > 0,
        textLength: document.body.innerText.length,
        
        // 检查代码块
        codeBlocks: document.querySelectorAll('pre, code').length,
        
        // 检查表格
        tables: document.querySelectorAll('table').length,
        
        // 检查图片
        images: document.querySelectorAll('img').length,
        imageSrcs: Array.from(document.querySelectorAll('img')).slice(0, 10).map(img => ({
          src: img.src?.substring(0, 100),
          alt: img.alt
        })),
        
        // 检查链接
        links: document.querySelectorAll('a').length,
        
        // 检查附件（常见关键词）
        attachments: document.querySelectorAll('[class*="attach"], [class*="file"], [class*="download"], a[href*="download"], a[href*="attach"]').length,
        attachmentLinks: Array.from(document.querySelectorAll('a[href*="download"], a[href*="attach"]')).slice(0, 10).map(a => ({
          text: a.innerText?.substring(0, 50),
          href: a.href?.substring(0, 100)
        })),
        
        // 检查元数据（常见关键词）
        metadata: {
          author: document.querySelector('[class*="author"], [class*="user"], [name*="author"]')?.innerText?.substring(0, 100),
          department: document.querySelector('[class*="dept"], [class*="org"], [name*="department"]')?.innerText?.substring(0, 100),
          date: document.querySelector('[class*="date"], [class*="time"], [name*="date"], [name*="time"]')?.innerText?.substring(0, 100),
          docNumber: document.querySelector('[class*="doc"], [class*="number"], [name*="number"]')?.innerText?.substring(0, 100)
        },
        
        // 检查评论/回复
        comments: document.querySelectorAll('[class*="comment"], [class*="reply"], [class*="response"]').length,
        
        // 主要内容的选择器（尝试常见模式）
        mainContentSelectors: [
          document.querySelector('#content, .content, [class*="content"], [id*="content"]') ? 'found' : 'not found',
          document.querySelector('#main, .main, [class*="main"], [id*="main"]') ? 'found' : 'not found',
          document.querySelector('#detail, .detail, [class*="detail"], [id*="detail"]') ? 'found' : 'not found',
          document.querySelector('[role="main"]') ? 'found' : 'not found'
        ],
        
        // 页面类名（帮助识别框架）
        bodyClasses: document.body.className?.substring(0, 200),
        
        // 检查是否是 iframe
        iframes: document.querySelectorAll('iframe').length,
        
        // 表单元素（登录表单分析）
        loginForm: {
          formSelector: document.querySelector('form')?.id || document.querySelector('form')?.className,
          usernameField: document.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[name*="account"]')?.name,
          passwordField: document.querySelector('input[type="password"]')?.name,
          submitButton: document.querySelector('input[type="submit"], button[type="submit"]')?.id || document.querySelector('input[type="submit"], button[type="submit"]')?.className
        }
      };
      
      return analysis;
    });

    // 输出分析结果
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 页面结构分析报告');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`📄 页面标题：${pageAnalysis.title}`);
    console.log(`🔗 页面 URL: ${pageAnalysis.url.substring(0, 100)}...`);
    console.log('');
    
    console.log('📊 元素统计:');
    console.log(`  - 文本长度：${pageAnalysis.textLength} 字符`);
    console.log(`  - 代码块：${pageAnalysis.codeBlocks} 个`);
    console.log(`  - 表格：${pageAnalysis.tables} 个`);
    console.log(`  - 图片：${pageAnalysis.images} 个`);
    console.log(`  - 链接：${pageAnalysis.links} 个`);
    console.log(`  - 附件：${pageAnalysis.attachments} 个`);
    console.log(`  - 评论/回复：${pageAnalysis.comments} 个`);
    console.log(`  - Iframe: ${pageAnalysis.iframes} 个`);
    console.log('');
    
    console.log('🏷️  元数据:');
    console.log(`  - 作者：${pageAnalysis.metadata.author || '未检测到'}`);
    console.log(`  - 部门：${pageAnalysis.metadata.department || '未检测到'}`);
    console.log(`  - 日期：${pageAnalysis.metadata.date || '未检测到'}`);
    console.log(`  - 文号：${pageAnalysis.metadata.docNumber || '未检测到'}`);
    console.log('');
    
    console.log('📦 附件链接:');
    if (pageAnalysis.attachmentLinks.length > 0) {
      pageAnalysis.attachmentLinks.forEach((att, i) => {
        console.log(`  ${i + 1}. ${att.text || '无文本'} → ${att.href || '无链接'}`);
      });
    } else {
      console.log('  未检测到附件链接');
    }
    console.log('');
    
    console.log('🖼️  图片（前 10 个）:');
    if (pageAnalysis.imageSrcs.length > 0) {
      pageAnalysis.imageSrcs.forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.src || '无 src'} (alt: ${img.alt || '无'})`);
      });
    } else {
      console.log('  未检测到图片');
    }
    console.log('');
    
    console.log('📍 主要内容区域:');
    console.log(`  - #content/.content: ${pageAnalysis.mainContentSelectors[0]}`);
    console.log(`  - #main/.main: ${pageAnalysis.mainContentSelectors[1]}`);
    console.log(`  - #detail/.detail: ${pageAnalysis.mainContentSelectors[2]}`);
    console.log(`  - [role="main"]: ${pageAnalysis.mainContentSelectors[3]}`);
    console.log('');
    
    console.log('🏷️  Body Classes:');
    console.log(`  ${pageAnalysis.bodyClasses || '无'}`);
    console.log('');
    
    console.log('🔐 登录表单分析:');
    console.log(`  - Form: ${pageAnalysis.loginForm.formSelector || '未检测到'}`);
    console.log(`  - 用户名字段：${pageAnalysis.loginForm.usernameField || '未检测到'}`);
    console.log(`  - 密码字段：${pageAnalysis.loginForm.passwordField || '未检测到'}`);
    console.log(`  - 提交按钮：${pageAnalysis.loginForm.submitButton || '未检测到'}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 分析完成！截图文件：01-login-page.png, 02-after-login.png, 03-target-page.png');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    
    // 即使出错也保存当前截图
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('💾 错误截图已保存：error-screenshot.png');
    } catch (e) {
      // 忽略
    }
  } finally {
    // 保持浏览器打开 10 秒以便观察
    console.log('\n👀 浏览器将在 10 秒后关闭...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
})();
