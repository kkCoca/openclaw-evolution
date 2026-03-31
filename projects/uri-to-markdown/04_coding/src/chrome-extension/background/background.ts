// Chrome 插件 background service worker
// 负责 HTML 到 Markdown 的转换

// 简化的 Turndown 实现（完整版应使用打包后的核心库）
class SimpleTurndown {
  turndown(html: string): string {
    // 创建临时 DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 移除 script/style 标签
    doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    // 转换 HTML 为 Markdown
    return this.convertNode(doc.body);
  }

  private convertNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'h1': return `# ${this.getTextContent(element)}\n\n`;
      case 'h2': return `## ${this.getTextContent(element)}\n\n`;
      case 'h3': return `### ${this.getTextContent(element)}\n\n`;
      case 'h4': return `#### ${this.getTextContent(element)}\n\n`;
      case 'h5': return `##### ${this.getTextContent(element)}\n\n`;
      case 'h6': return `###### ${this.getTextContent(element)}\n\n`;
      
      case 'p': return `${this.getTextContent(element)}\n\n`;
      
      case 'br': return '\n';
      
      case 'hr': return '---\n\n';
      
      case 'strong':
      case 'b': return `**${this.getTextContent(element)}**`;
      
      case 'em':
      case 'i': return `*${this.getTextContent(element)}*`;
      
      case 'a': {
        const href = element.getAttribute('href') || '';
        const text = this.getTextContent(element);
        return text ? `[${text}](${href})` : '';
      }
      
      case 'img': {
        const src = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || '';
        return `![${alt}](${src})\n\n`;
      }
      
      case 'ul':
      case 'ol': {
        const items = Array.from(element.children);
        const marker = tagName === 'ul' ? '-' : '1.';
        return items.map(item => `${marker} ${this.getTextContent(item)}\n`).join('') + '\n';
      }
      
      case 'table': {
        return this.convertTable(element);
      }
      
      case 'code': {
        const parent = element.parentElement;
        if (parent?.tagName === 'PRE') {
          // 代码块已在 pre 中处理
          return '';
        }
        return `\`${this.getTextContent(element)}\``;
      }
      
      case 'pre': {
        const code = element.querySelector('code');
        const content = code ? code.textContent : element.textContent;
        return '```\n' + content + '\n```\n\n';
      }
      
      case 'blockquote': {
        const content = this.getTextContent(element);
        return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
      }

      default: {
        // 递归处理子节点
        let content = '';
        element.childNodes.forEach(child => {
          content += this.convertNode(child);
        });
        return content;
      }
    }
  }

  private convertTable(table: HTMLTableElement): string {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const markdownRows: string[][] = [];
    
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowText = cells.map(cell => 
        cell.textContent?.trim().replace(/\n/g, ' ') || ''
      );
      markdownRows.push(rowText);
    }

    if (markdownRows.length === 0) return '';

    const header = markdownRows[0];
    const separator = header.map(() => '---').join(' | ');
    const body = markdownRows.slice(1)
      .filter(row => row.some(cell => cell.trim() !== ''))
      .map(row => row.join(' | '))
      .join('\n');

    if (!body) return '';

    return `${header.join(' | ')}\n${separator}\n${body}\n\n`;
  }

  private getTextContent(element: Element): string {
    return element.textContent?.trim() || '';
  }
}

// 处理消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convert') {
    try {
      const turndown = new SimpleTurndown();
      const markdown = turndown.turndown(request.html);

      // 提取元数据
      const meta = request.options?.withMeta ? {
        title: extractMeta(request.html, 'title') || document.title,
        url: request.url
      } : undefined;

      sendResponse({
        success: true,
        markdown,
        meta
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : '转换失败'
      });
    }
  }

  return true; // 保持消息通道开放
});

// 辅助函数：从 HTML 中提取元数据
function extractMeta(html: string, type: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  switch (type) {
    case 'title':
      return doc.title;
    case 'author':
      return doc.querySelector('meta[name="author"]')?.getAttribute('content');
    case 'date':
      return doc.querySelector('meta[name="date"]')?.getAttribute('content') ||
             doc.querySelector('meta[name="publishdate"]')?.getAttribute('content');
    default:
      return null;
  }
}
