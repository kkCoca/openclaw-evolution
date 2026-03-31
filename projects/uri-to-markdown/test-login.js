const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA 自动登录测试');
  console.log('═══════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ 
    headless: false,  // 使用有头模式，方便观察
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    // ═══════════════════════════════════════════════════════════
    // 步骤 1: 打开登录页面
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 1: 打开登录页面...\n');
    
    await page.goto('https://xt.seeyon.com/seeyon/main.do?method=main', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.screenshot({ path: '01-login-page.png' });
    console.log('✅ 登录页面截图已保存\n');

    // 等待页面完全加载
    await page.waitForTimeout(3000);

    // ═══════════════════════════════════════════════════════════
    // 步骤 2: 分析登录表单
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 2: 分析登录表单...\n');
    
    const formInfo = await page.evaluate(() => {
      const usernameInput = document.querySelector('#login_username, input[name="login_username"]');
      const passwordInput = document.querySelector('#login_password1, input[name="login_password1"]');
      const loginButton = document.querySelector('#login_button, button[id="login_button"]');
      const submitButton = document.querySelector('#submit_button, input[type="submit"]');
      
      return {
        username: {
          found: !!usernameInput,
          visible: usernameInput?.offsetParent !== null,
          type: usernameInput?.type,
          id: usernameInput?.id,
          name: usernameInput?.name
        },
        password: {
          found: !!passwordInput,
          visible: passwordInput?.offsetParent !== null,
          type: passwordInput?.type,
          id: passwordInput?.id,
          name: passwordInput?.name
        },
        loginButton: {
          found: !!loginButton,
          visible: loginButton?.offsetParent !== null,
          id: loginButton?.id,
          type: loginButton?.type
        },
        submitButton: {
          found: !!submitButton,
          visible: submitButton?.offsetParent !== null,
          id: submitButton?.id
        },
        // 检查是否有登录相关的 JavaScript 函数
        globalFunctions: Object.keys(window).filter(k => k.toLowerCase().includes('login')).slice(0, 10)
      };
    });
    
    console.log('📝 表单元素:');
    console.log(`  用户名输入框：${formInfo.username.found ? '✅ 找到' : '❌ 未找到'}, visible=${formInfo.username.visible}`);
    console.log(`  密码输入框：${formInfo.password.found ? '✅ 找到' : '❌ 未找到'}, visible=${formInfo.password.visible}`);
    console.log(`  登录按钮：${formInfo.loginButton.found ? '✅ 找到' : '❌ 未找到'}, visible=${formInfo.loginButton.visible}`);
    console.log(`  提交按钮：${formInfo.submitButton.found ? '✅ 找到' : '❌ 未找到'}, visible=${formInfo.submitButton.visible}`);
    console.log('');
    
    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 尝试多种登录策略
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 尝试自动登录...\n');
    
    const credentials = {
      username: 'ouyp',
      password: 'ouyangpeng1012'
    };
    
    let loginSuccess = false;
    
    // 策略 1: 直接填充并点击登录按钮
    try {
      console.log('🔑 策略 1: 填充用户名和密码...\n');
      
      // 填充用户名
      const usernameSelector = '#login_username, input[name="login_username"]';
      const usernameElement = await page.$(usernameSelector);
      if (usernameElement) {
        console.log(`  ✅ 找到用户名输入框：${usernameSelector}`);
        await usernameElement.fill(credentials.username);
        console.log(`  ✅ 已填充用户名：${credentials.username}\n`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`  ❌ 未找到用户名输入框\n`);
      }
      
      // 填充密码
      const passwordSelector = '#login_password1, input[name="login_password1"]';
      const passwordElement = await page.$(passwordSelector);
      if (passwordElement) {
        console.log(`  ✅ 找到密码输入框：${passwordSelector}`);
        await passwordElement.fill(credentials.password);
        console.log(`  ✅ 已填充密码\n`);
        await page.waitForTimeout(1000);
      } else {
        console.log(`  ❌ 未找到密码输入框\n`);
      }
      
      // 尝试点击登录按钮
      const loginBtnSelector = '#login_button, button[id="login_button"]';
      const loginBtn = await page.$(loginBtnSelector);
      if (loginBtn) {
        console.log(`  ✅ 找到登录按钮：${loginBtnSelector}`);
        console.log(`  🖱️  尝试点击登录按钮...\n`);
        
        // 尝试多种点击方式
        try {
          // 方式 1: 直接点击
          await loginBtn.click();
          console.log('  ✅ 点击成功（方式 1: 直接点击）\n');
        } catch (e1) {
          try {
            // 方式 2: 强制点击
            await loginBtn.click({ force: true });
            console.log('  ✅ 点击成功（方式 2: 强制点击）\n');
          } catch (e2) {
            try {
              // 方式 3: 触发 click 事件
              await loginBtn.dispatchEvent('click');
              console.log('  ✅ 点击成功（方式 3: 触发事件）\n');
            } catch (e3) {
              // 方式 4: 通过 JavaScript 点击
              await page.evaluate(() => {
                const btn = document.querySelector('#login_button');
                if (btn) btn.click();
              });
              console.log('  ✅ 点击成功（方式 4: JavaScript 点击）\n');
            }
          }
        }
        
        // 等待导航
        console.log('  ⏳ 等待页面跳转...\n');
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 });
          loginSuccess = true;
          console.log('  ✅ 页面已跳转，登录可能成功！\n');
        } catch (e) {
          console.log('  ⚠️ 等待导航超时，但可能已登录\n');
        }
      } else {
        console.log('  ❌ 未找到登录按钮\n');
        
        // 尝试按 Enter 键
        console.log('  ⌨️  尝试按 Enter 键提交...\n');
        await passwordElement?.press('Enter');
        await page.waitForTimeout(3000);
      }
      
    } catch (error) {
      console.log(`❌ 策略 1 失败：${error.message}\n`);
    }
    
    // 截图
    await page.screenshot({ path: '02-after-login.png' });
    console.log('✅ 登录后截图已保存：02-after-login.png\n');

    // 检查是否登录成功
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('main.do?method=main') && !currentUrl.includes('login');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 登录结果检查');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`  当前 URL: ${currentUrl.substring(0, 150)}...`);
    console.log(`  登录状态：${isLoggedIn ? '✅ 成功' : '❌ 失败'}\n`);
    
    if (isLoggedIn) {
      console.log('🎉 登录成功！\n');
      
      // ═══════════════════════════════════════════════════════════
      // 步骤 4: 访问目标页面
      // ═══════════════════════════════════════════════════════════
      console.log('📌 步骤 4: 访问目标页面...\n');
      
      const targetUrl = 'https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&extendParams=%7B%22formmain_66717_0_id%22%3A%22397711044024549379%22%7D';
      
      await page.goto(targetUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      await page.screenshot({ path: '03-target-page.png', fullPage: true });
      console.log('✅ 目标页面截图已保存：03-target-page.png\n');
      
      // 检查是否被重定向
      const finalUrl = page.url();
      if (finalUrl.includes('main.do') || finalUrl.includes('login')) {
        console.log('⚠️ 被重定向到登录页，可能 Cookie 未正确传递\n');
      } else {
        console.log('✅ 成功访问目标页面\n');
        
        // 分析页面内容
        console.log('📌 步骤 5: 分析目标页面内容...\n');
        
        const pageContent = await page.evaluate(() => {
          const mainContent = document.querySelector('#content, .content, [class*="content"], #main, .main, [role="main"]') || document.body;
          
          return {
            title: document.title,
            url: window.location.href,
            textLength: document.body.innerText.length,
            textPreview: document.body.innerText.substring(0, 1000),
            tables: document.querySelectorAll('table').length,
            images: document.querySelectorAll('img').length,
            links: document.querySelectorAll('a').length,
            metadata: {
              title: document.querySelector('h1, h2, .title')?.innerText?.substring(0, 200),
              author: document.querySelector('[class*="author"], [class*="user"]')?.innerText?.substring(0, 100),
              date: document.querySelector('[class*="date"], [class*="time"]')?.innerText?.substring(0, 100)
            },
            iframes: window.frames.length
          };
        });
        
        console.log('📋 页面内容分析:');
        console.log(`  标题：${pageContent.title}`);
        console.log(`  URL: ${pageContent.url.substring(0, 150)}...`);
        console.log(`  文本长度：${pageContent.textLength} 字符`);
        console.log(`  表格：${pageContent.tables} 个`);
        console.log(`  图片：${pageContent.images} 个`);
        console.log(`  链接：${pageContent.links} 个`);
        console.log(`  Iframe: ${pageContent.iframes} 个`);
        console.log('');
        console.log(`  内容预览:`);
        console.log(`  ${pageContent.textPreview.substring(0, 500)}...`);
        console.log('');
        
        if (pageContent.metadata.title) {
          console.log(`  元数据标题：${pageContent.metadata.title}`);
        }
        if (pageContent.metadata.author) {
          console.log(`  作者：${pageContent.metadata.author}`);
        }
        if (pageContent.metadata.date) {
          console.log(`  日期：${pageContent.metadata.date}`);
        }
      }
      
    } else {
      console.log('❌ 登录失败，请检查账号密码或登录流程\n');
      
      // 保存调试信息
      const debugInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          bodyText: document.body.innerText.substring(0, 500),
          inputs: Array.from(document.querySelectorAll('input')).map(i => ({
            type: i.type,
            name: i.name,
            id: i.id,
            value: i.value
          }))
        };
      });
      
      console.log('📝 调试信息:');
      console.log(`  URL: ${debugInfo.url}`);
      console.log(`  标题：${debugInfo.title}`);
      console.log(`  页面文本：${debugInfo.bodyText.substring(0, 200)}...`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ 测试完成！');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 保持浏览器打开，方便人工检查
    console.log('👀 浏览器将保持打开 60 秒，请检查登录状态...\n');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('💾 错误截图已保存：error-screenshot.png\n');
    
    // 保持浏览器打开
    await page.waitForTimeout(30000);
  } finally {
    await browser.close();
    console.log('\n👋 浏览器已关闭\n');
  }
})();
