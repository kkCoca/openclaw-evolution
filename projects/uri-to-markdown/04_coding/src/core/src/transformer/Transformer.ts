import TurndownService from 'turndown';
import { PageMeta, ConvertResult, TransformOptions } from '../types';

export class Transformer {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      hr: '---',
      bulletListMarker: '-',
      linkStyle: 'inlined'
    });

    this.addCustomRules();
  }

  private addCustomRules(): void {
    // 移除 script/style 标签
    this.turndownService.remove(['script', 'style', 'noscript']);

    // 移除导航/广告区域
    this.turndownService.remove((node) => {
      const element = node as Element;
      const className = element.className || '';
      const id = element.id || '';
      
      // 常见导航/广告类名
      const skipClasses = [
        'nav', 'navigation', 'header', 'footer',
        'sidebar', 'advertisement', 'ads'
      ];

      return skipClasses.some(cls => 
        className.includes(cls) || id.includes(cls)
      );
    });

    // 自定义表格处理
    this.turndownService.addRule('table', {
      filter: 'table',
      replacement: (content, node) => {
        return this.convertTable(node as HTMLTableElement);
      }
    });

    // 保留 iframe 内容标记
    this.turndownService.addRule('frameSeparator', {
      filter: (node) => {
        return node.nodeType === 8 && node.textContent?.includes('FRAME_SEPARATOR');
      },
      replacement: () => '\n\n---\n\n'
    });
  }

  async transform(html: string, options?: TransformOptions): Promise<string> {
    const markdown = this.turndownService.turndown(html);
    return this.cleanMarkdown(markdown);
  }

  private convertTable(table: HTMLTableElement): string {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const markdownRows: string[][] = [];
    
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowText = cells.map(cell => {
        const text = cell.textContent?.trim().replace(/\n/g, ' ') || '';
        // 清理多余空格
        return text.replace(/\s+/g, ' ');
      });
      markdownRows.push(rowText);
    }

    return this.markdownTable(markdownRows);
  }

  private markdownTable(rows: string[][]): string {
    if (rows.length === 0) return '';

    const header = rows[0];
    const separator = header.map(() => '---').join(' | ');
    const body = rows.slice(1)
      .filter(row => row.some(cell => cell.trim() !== '')) // 跳过空行
      .map(row => row.join(' | '))
      .join('\n');

    if (!body) return '';

    return `${header.join(' | ')}\n${separator}\n${body}`;
  }

  private cleanMarkdown(markdown: string): string {
    return markdown
      // 清理多余空行
      .replace(/\n{3,}/g, '\n\n')
      // 清理行首行尾空白
      .trim();
  }

  extractMeta(document: any): PageMeta {
    return {
      title: document.title || 'Untitled',
      author: document.querySelector('meta[name="author"]')?.getAttribute('content') || undefined,
      date: document.querySelector('meta[name="date"]')?.getAttribute('content') || 
            document.querySelector('meta[name="publishdate"]')?.getAttribute('content') || undefined,
      url: document.URL || '',
      convertedAt: new Date().toISOString()
    };
  }
}
