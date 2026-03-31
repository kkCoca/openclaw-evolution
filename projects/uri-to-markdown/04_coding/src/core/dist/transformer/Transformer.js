import TurndownService from 'turndown';
export class Transformer {
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
    addCustomRules() {
        // 移除 script/style 标签
        this.turndownService.remove(['script', 'style', 'noscript']);
        // 移除导航/广告区域
        this.turndownService.remove((node) => {
            const element = node;
            const className = element.className || '';
            const id = element.id || '';
            // 常见导航/广告类名
            const skipClasses = [
                'nav', 'navigation', 'header', 'footer',
                'sidebar', 'advertisement', 'ads'
            ];
            return skipClasses.some(cls => className.includes(cls) || id.includes(cls));
        });
        // 自定义表格处理
        this.turndownService.addRule('table', {
            filter: 'table',
            replacement: (content, node) => {
                return this.convertTable(node);
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
    async transform(html, options) {
        const markdown = this.turndownService.turndown(html);
        return this.cleanMarkdown(markdown);
    }
    convertTable(table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0)
            return '';
        const markdownRows = [];
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
    markdownTable(rows) {
        if (rows.length === 0)
            return '';
        const header = rows[0];
        const separator = header.map(() => '---').join(' | ');
        const body = rows.slice(1)
            .filter(row => row.some(cell => cell.trim() !== '')) // 跳过空行
            .map(row => row.join(' | '))
            .join('\n');
        if (!body)
            return '';
        return `${header.join(' | ')}\n${separator}\n${body}`;
    }
    cleanMarkdown(markdown) {
        return markdown
            // 清理多余空行
            .replace(/\n{3,}/g, '\n\n')
            // 清理行首行尾空白
            .trim();
    }
    extractMeta(document) {
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
//# sourceMappingURL=Transformer.js.map