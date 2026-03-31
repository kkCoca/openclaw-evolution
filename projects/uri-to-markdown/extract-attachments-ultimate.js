const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 致远 OA - 获取附件真实下载 URL（终极方案）');
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
    await page.waitForTimeout(5000);
    
    console.log('✅ 页面加载完成\n');

    // ═══════════════════════════════════════════════════════════
    // 步骤 3: 定位目标 iframe
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 3: 定位目标 iframe...\n');
    
    const frames = page.frames();
    let targetFrame = null;
    
    for (const frame of frames) {
      try {
        const textLength = await frame.evaluate(() => document.body.innerText.length);
        if (textLength > 100 && frame.url().includes('collaboration')) {
          targetFrame = frame;
          console.log(`✅ 找到目标 Frame: ${frame.url().substring(0, 100)}...\n`);
          break;
        }
      } catch (e) {}
    }
    
    if (!targetFrame) {
      console.log('❌ 未找到目标 Frame\n');
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // 步骤 4: 在 iframe 上下文中查找附件的完整信息
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 4: 深度分析附件元素结构...\n');
    
    const attachmentAnalysis = await targetFrame.evaluate(() => {
      const results = [];
      
      // 查找所有带有 download 属性的 a 标签
      const downloadLinks = Array.from(document.querySelectorAll('a[download]'));
      
      downloadLinks.forEach((link, idx) => {
        const filenameSpan = link.querySelector('.filename');
        const extSpan = link.querySelector('span:last-child');
        
        const fileName = filenameSpan?.innerText || '';
        const extension = extSpan?.innerText || '';
        const fullName = fileName + extension;
        
        // 向上查找父容器，寻找可能的数据属性
        let parent = link.parentElement;
        let containerData = null;
        let fiberId = null;
        let clickHandler = null;
        
        // 查找 fiber-id 属性（致远 OA 的标识）
        let current = link;
        for (let i = 0; i < 5 && current; i++) {
          if (current.hasAttribute('fiber-id')) {
            fiberId = current.getAttribute('fiber-id');
          }
          // 检查 onclick
          if (current.getAttribute('onclick')) {
            clickHandler = current.getAttribute('onclick');
          }
          // 查找 data-* 属性
          const dataAttrs = Array.from(current.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {});
          
          if (Object.keys(dataAttrs).length > 0) {
            containerData = dataAttrs;
          }
          current = current.parentElement;
        }
        
        // 获取完整的 outerHTML
        const outerHTML = link.outerHTML;
        
        // 尝试从父容器找 URL
        const parentContainer = link.closest('.file-item, .attachment-item, [class*="file"], [class*="attach"]');
        const parentHTML = parentContainer?.outerHTML?.substring(0, 1000);
        
        results.push({
          index: idx,
          fileName: fullName,
          extension,
          hasDownloadAttr: link.hasAttribute('download'),
          href: link.href || link.getAttribute('href') || '',
          fiberId,
          clickHandler,
          containerData,
          outerHTML,
          parentHTML,
          className: link.className,
          id: link.id
        });
      });
      
      return results;
    });
    
    console.log(`  找到 ${attachmentAnalysis.length} 个带 download 属性的链接\n`);
    
    attachmentAnalysis.forEach((att, idx) => {
      console.log(`  ${idx + 1}. ${att.fileName}`);
      console.log(`     href: "${att.href || '(空)'}"`);
      console.log(`     fiber-id: ${att.fiberId || 'N/A'}`);
      console.log(`     onclick: ${att.clickHandler || 'N/A'}`);
      console.log(`     data 属性: ${JSON.stringify(att.containerData) || 'N/A'}`);
      console.log(`     outerHTML: ${att.outerHTML.substring(0, 300)}...`);
      console.log('');
    });

    // ═══════════════════════════════════════════════════════════
    // 步骤 5: 尝试通过 window 对象获取附件数据
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 5: 尝试从 window 对象获取附件数据...\n');
    
    const windowData = await targetFrame.evaluate(() => {
      const data = {
        // 尝试常见的全局变量
        globalVars: {},
        // 尝试从 Vue 实例获取
        vueData: null,
        // 尝试从 localStorage/sessionStorage 获取
        storage: {}
      };
      
      // 检查 localStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('file') || key.includes('attach') || key.includes('collaboration'))) {
            data.storage[key] = localStorage.getItem(key).substring(0, 200);
          }
        }
      } catch (e) {}
      
      // 检查 window 对象上可能的文件数据
      const possibleVars = ['fileData', 'attachmentData', 'files', 'attachments', 'collaborationData', 'form_data'];
      possibleVars.forEach(varName => {
        if (window[varName]) {
          try {
            data.globalVars[varName] = JSON.stringify(window[varName]).substring(0, 500);
          } catch (e) {
            data.globalVars[varName] = typeof window[varName];
          }
        }
      });
      
      // 尝试查找 Vue 实例
      if (document.querySelector('[data-v-]')) {
        const el = document.querySelector('[data-v-]');
        if (el.__vue__) {
          try {
            data.vueData = {
              hasVue: true,
              dataKeys: Object.keys(el.__vue__.$data || {}).slice(0, 20)
            };
          } catch (e) {}
        }
      }
      
      return data;
    });
    
    console.log('  localStorage 数据:');
    console.log(JSON.stringify(windowData.storage, null, 2));
    console.log('');
    console.log('  全局变量:');
    console.log(JSON.stringify(windowData.globalVars, null, 2));
    console.log('');
    console.log('  Vue 实例:');
    console.log(JSON.stringify(windowData.vueData, null, 2));
    console.log('');

    // ═══════════════════════════════════════════════════════════
    // 步骤 6: 模拟点击下载，捕获真实 URL
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 6: 模拟点击下载，捕获真实 URL...\n');
    
    const capturedUrls = [];
    
    // 监听所有请求
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('file') || url.includes('attach') || url.includes('download') || url.includes('common.do')) {
        console.log(`  📡 请求：${url}`);
        capturedUrls.push({
          url,
          method: request.method(),
          postData: request.postData()?.substring(0, 200)
        });
      }
    });
    
    // 尝试点击第一个附件链接
    if (attachmentAnalysis.length > 0) {
      try {
        await targetFrame.click('a[download]', { timeout: 5000 });
        await page.waitForTimeout(3000);
        console.log('  ✅ 已触发点击下载\n');
      } catch (e) {
        console.log(`  ⚠️ 点击失败：${e.message}\n`);
      }
    }
    
    if (capturedUrls.length > 0) {
      console.log('\n📦 捕获到的 URL:\n');
      capturedUrls.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.url}`);
        console.log(`     Method: ${item.method}`);
        console.log(`     PostData: ${item.postData || 'N/A'}`);
        console.log('');
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 步骤 7: 保存结果
    // ═══════════════════════════════════════════════════════════
    console.log('📌 步骤 7: 保存结果...\n');
    
    const result = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      attachments: attachmentAnalysis,
      windowData,
      capturedUrls
    };
    
    fs.writeFileSync('attachment-ultimate.json', JSON.stringify(result, null, 2));
    console.log('✅ 结果已保存：attachment-ultimate.json\n');
    
    // 生成 Markdown 报告
    let markdown = `# 致远 OA 附件 URL 提取报告（终极方案）\n\n`;
    markdown += `**URL**: ${targetUrl}\n\n`;
    markdown += `**时间**: ${result.timestamp}\n\n`;
    
    markdown += `## 附件列表（${attachmentAnalysis.length}个）\n\n`;
    attachmentAnalysis.forEach((att, idx) => {
      markdown += `### ${idx + 1}. ${att.fileName}\n\n`;
      markdown += `\`\`\`\n`;
      markdown += `href: "${att.href || '(空)'}"\n`;
      markdown += `fiber-id: ${att.fiberId || 'N/A'}\n`;
      markdown += `onclick: ${att.clickHandler || 'N/A'}\n`;
      markdown += `data 属性：${JSON.stringify(att.containerData, null, 2)}\n`;
      markdown += `HTML: ${att.outerHTML}\n`;
      markdown += `\`\`\`\n\n`;
    });
    
    markdown += `## 捕获的网络请求\n\n`;
    if (capturedUrls.length === 0) {
      markdown += `*未捕获到附件相关的网络请求*\n\n`;
      markdown += `## 结论\n\n`;
      markdown += `致远 OA 的附件下载 URL 是通过 **JavaScript 动态生成**的，不在 HTML 中。\n\n`;
      markdown += `可能的原因：\n`;
      markdown += `1. 使用 Vue 组件，URL 在组件内部通过 API 获取\n`;
      markdown += `2. 点击下载时触发 JavaScript 事件，动态请求下载接口\n`;
      markdown += `3. 需要调用特定的 JavaScript 方法获取真实 URL\n\n`;
      markdown += `## 建议方案\n\n`;
      markdown += `1. **模拟点击下载** - 触发真实下载流程，捕获网络请求\n`;
      markdown += `2. **查找 API 接口** - 分析页面 JS 代码，找到获取附件列表的 API\n`;
      markdown += `3. **使用浏览器自动化** - 直接下载文件而非获取 URL\n`;
    } else {
      capturedUrls.forEach((item, idx) => {
        markdown += `${idx + 1}. ${item.url}\n`;
      });
    }
    
    fs.writeFileSync('attachment-report.md', markdown);
    console.log('✅ 报告已保存：attachment-report.md\n');
    
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
