// Chrome 插件 background service worker
// 目前不需要特殊逻辑，所有转换在 content script 中完成

// 监听扩展安装/更新事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[URI-to-Markdown] 扩展已安装/更新:', details.reason);
});
