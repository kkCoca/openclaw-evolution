// Chrome 插件 popup 页面逻辑

interface ConvertResult {
  markdown: string;
  meta?: {
    title: string;
    author?: string;
    date?: string;
    url: string;
  };
  attachments?: Array<{
    name: string;
    size: string;
    needsManualDownload: boolean;
  }>;
}

document.addEventListener('DOMContentLoaded', () => {
  const convertBtn = document.getElementById('convertBtn') as HTMLButtonElement;
  const preview = document.getElementById('preview') as HTMLDivElement;
  const previewContent = document.getElementById('previewContent') as HTMLPreElement;
  const actions = document.getElementById('actions') as HTMLDivElement;
  const status = document.getElementById('status') as HTMLDivElement;
  const metaInfo = document.getElementById('metaInfo') as HTMLDivElement;
  const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
  const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;

  let convertResult: ConvertResult | null = null;

  // 转换按钮点击事件
  convertBtn?.addEventListener('click', async () => {
    convertBtn.disabled = true;
    convertBtn.textContent = '转换中...';
    hideStatus();

    try {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('无法获取当前标签页');
      }

      showStatus('正在读取页面内容...', 'info');

      // 发送消息到 content script 获取页面 HTML
      const pageResponse = await chrome.tabs.sendMessage(tab.id, {
        action: 'getPageHtml'
      });

      if (!pageResponse.success) {
        throw new Error(pageResponse.error || '读取页面失败');
      }

      showStatus('正在转换为 Markdown...', 'info');

      // 获取选项
      const withMeta = (document.getElementById('withMeta') as HTMLInputElement).checked;
      const withAttachments = (document.getElementById('withAttachments') as HTMLInputElement).checked;
      const withFields = (document.getElementById('withFields') as HTMLInputElement).checked;

      // 调用 background script 进行转换
      const result = await chrome.runtime.sendMessage({
        action: 'convert',
        html: pageResponse.html,
        url: tab.url,
        options: {
          withMeta,
          withAttachments,
          withFields
        }
      });

      convertResult = result;

      // 显示元数据
      if (result.meta && withMeta) {
        metaInfo.innerHTML = `
          <p><strong>标题:</strong> ${escapeHtml(result.meta.title)}</p>
          ${result.meta.author ? `<p><strong>作者:</strong> ${escapeHtml(result.meta.author)}</p>` : ''}
          ${result.meta.date ? `<p><strong>日期:</strong> ${escapeHtml(result.meta.date)}</p>` : ''}
          <p><strong>URL:</strong> ${escapeHtml(result.meta.url)}</p>
        `;
        metaInfo.classList.add('show');
      } else {
        metaInfo.classList.remove('show');
      }

      // 显示预览
      previewContent.textContent = result.markdown;
      preview.classList.add('show');
      actions.classList.add('show');

      showStatus('转换成功！', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showStatus(`转换失败：${errorMessage}`, 'error');
      console.error('Conversion error:', error);
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = '转换当前页面';
    }
  });

  // 复制按钮点击事件
  copyBtn?.addEventListener('click', () => {
    if (!convertResult) return;

    navigator.clipboard.writeText(convertResult.markdown)
      .then(() => {
        showStatus('已复制到剪贴板', 'success');
      })
      .catch(() => {
        showStatus('复制失败', 'error');
      });
  });

  // 下载按钮点击事件
  downloadBtn?.addEventListener('click', () => {
    if (!convertResult) return;

    const blob = new Blob([convertResult.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    // 生成文件名
    const filename = generateFilename(convertResult.meta?.title);
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showStatus(`已下载：${filename}`, 'success');
  });

  // 显示状态消息
  function showStatus(message: string, type: 'success' | 'error' | 'info') {
    status.textContent = message;
    status.className = `status show ${type}`;
  }

  // 隐藏状态消息
  function hideStatus() {
    status.className = 'status';
  }

  // HTML 转义
  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 生成文件名
  function generateFilename(title?: string): string {
    if (!title) {
      return `markdown_${Date.now()}.md`;
    }

    // 清理文件名中的非法字符
    const safeTitle = title
      .replace(/[<>:"/\\|？*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    return `${safeTitle}.md`;
  }
});
