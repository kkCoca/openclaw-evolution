// Chrome 插件 content script
// 负责读取当前页面内容

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageHtml') {
    try {
      // 获取完整 HTML（包括动态加载的内容）
      const html = document.documentElement.outerHTML;
      
      sendResponse({
        success: true,
        html: html,
        url: document.URL,
        title: document.title
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : '读取页面失败'
      });
    }
  }
});
