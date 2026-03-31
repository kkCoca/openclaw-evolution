// Chrome 插件 content script
// 负责读取页面内容并进行 HTML 到 Markdown 的转换

// 简化的 Turndown 实现
class SimpleTurndown {
  turndown(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());
    return this.convertNode(doc.body);
  }

  private convertNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
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
      case 'strong': case 'b': return `**${this.getTextContent(element)}**`;
      case 'em': case 'i': return `*${this.getTextContent(element)}*`;
      case 'a': { const href = element.getAttribute('href') || ''; const text = this.getTextContent(element); return text ? `[${text}](${href})` : ''; }
      case 'img': { const src = element.getAttribute('src') || ''; const alt = element.getAttribute('alt') || ''; return `![${alt}](${src})\n\n`; }
      case 'ul': case 'ol': { const items = Array.from(element.children); const marker = tagName === 'ul' ? '-' : '1.'; return items.map(item => `${marker} ${this.getTextContent(item)}\n`).join('') + '\n'; }
      case 'table': return this.convertTable(element);
      case 'code': { if (element.parentElement?.tagName === 'PRE') return ''; return `\`${this.getTextContent(element)}\``; }
      case 'pre': { const code = element.querySelector('code'); const content = code ? code.textContent : element.textContent; return '```\n' + content + '\n```\n\n'; }
      case 'blockquote': { const content = this.getTextContent(element); return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n'; }
      default: { let content = ''; element.childNodes.forEach(child => { content += this.convertNode(child); }); return content; }
    }
  }

  private convertTable(table: HTMLTableElement): string {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';
    const markdownRows: string[][] = [];
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowText = cells.map(cell => cell.textContent?.trim().replace(/\n/g, ' ') || '');
      markdownRows.push(rowText);
    }
    if (markdownRows.length === 0) return '';
    const header = markdownRows[0];
    const separator = header.map(() => '---').join(' | ');
    const body = markdownRows.slice(1).filter(row => row.some(cell => cell.trim() !== '')).map(row => row.join(' | ')).join('\n');
    if (!body) return '';
    return `${header.join(' | ')}\n${separator}\n${body}\n\n`;
  }

  private getTextContent(element: Element): string {
    return element.textContent?.trim() || '';
  }
}

// 提取元数据
function extractMeta(html: string, type: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  switch (type) {
    case 'title': return doc.title;
    case 'author': return doc.querySelector('meta[name="author"]')?.getAttribute('content');
    case 'date': return doc.querySelector('meta[name="date"]')?.getAttribute('content') || doc.querySelector('meta[name="publishdate"]')?.getAttribute('content');
    default: return null;
  }
}

// 格式化字段为 Markdown
function formatFieldsAsMarkdown(fields: Record<string, Record<string, string>>): string {
  const lines: string[] = [];
  for (const [region, regionFields] of Object.entries(fields)) {
    lines.push(`## ${region}\n`);
    for (const [name, value] of Object.entries(regionFields)) {
      lines.push(`- **${name}**: ${value || '(空)'}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// 消息处理
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    if (request.action === 'getPageHtml') {
      let html = document.documentElement.outerHTML;
      const iframes = document.querySelectorAll('iframe');
      console.log(`[URI-to-Markdown] 检测到 ${iframes.length} 个 iframe`);
      
      const frameContents: string[] = [];
      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const bodyContent = iframeDoc.body?.innerHTML || '';
            const textLength = iframeDoc.body?.textContent?.length || 0;
            console.log(`[URI-to-Markdown] iframe 内容长度：${textLength} 字符`);
            if (textLength > 0) {
              frameContents.push(bodyContent);
              console.log('[URI-to-Markdown] 已提取 iframe 内容');
            }
          }
        } catch (e) {
          console.warn('[URI-to-Markdown] 无法访问跨域 iframe:', e);
        }
      }
      
      if (frameContents.length > 0) {
        html = html.replace('</body>', '<!-- IFRAME_CONTENT_START -->' + frameContents.join('<hr><!-- FRAME_SEPARATOR -->') + '<!-- IFRAME_CONTENT_END --></body>');
        console.log(`[URI-to-Markdown] 已合并 ${frameContents.length} 个 iframe 内容`);
      }
      
      sendResponse({ success: true, html, url: document.URL, title: document.title, iframeCount: frameContents.length });
    }
    
    if (request.action === 'convert') {
      console.log('[URI-to-Markdown] 开始转换，HTML 长度:', request.html?.length);
      
      const turndown = new SimpleTurndown();
      const markdown = turndown.turndown(request.html);
      console.log('[URI-to-Markdown] 转换完成，Markdown 长度:', markdown?.length);
      
      const meta = request.options?.withMeta ? {
        title: extractMeta(request.html, 'title') || document.title,
        url: request.url,
        author: extractMeta(request.html, 'author') || undefined,
        date: extractMeta(request.html, 'date') || undefined
      } : undefined;
      
      // 提取表单字段（致远 OA 专用）
      let fieldsMarkdown = '';
      if (request.options?.withFields) {
        try {
          const fields: Record<string, Record<string, string>> = {};
          const regions = ['BUG 单期限信息', '上报人信息', '客户信息', '联系人信息', '问题描述信息', '开发人员填写', '备注说明', '补丁包相关', '核心代码', '转客开处理', '代码检查结果', '诊断结论', '测试人员填写', '客开人员填写信息', '区域客开', '发起人交付信息'];
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(request.html, 'text/html');
          
          // 查找所有 DIV，筛选包含":"或":"的（字段名：字段值 格式）
          const allDivs = Array.from(doc.querySelectorAll('div'));
          const fieldDivs = allDivs.filter(div => {
            const text = div.textContent?.trim() || '';
            return text.length > 0 && text.length < 500 && (text.includes(':') || text.includes(':'));
          });
          
          console.log('[URI-to-Markdown] 找到可能包含字段的 DIV 数量:', fieldDivs.length);
          
          // 输出前 20 个 DIV 详情
          console.log('[URI-to-Markdown] 前 20 个字段的 DIV:');
          for (let i = 0; i < Math.min(20, fieldDivs.length); i++) {
            const div = fieldDivs[i];
            const text = div.textContent?.trim() || '';
            const className = div.className || 'no-class';
            console.log(`  ${i}: class="${className.substring(0, 50)}" text="${text.substring(0, 100)}..."`);
          }
          
          // 提取所有文本
          const allTexts: string[] = [];
          fieldDivs.forEach(div => {
            const text = div.textContent?.trim();
            if (text && text.length > 0 && text.length < 500) {
              allTexts.push(text);
            }
          });
          
          console.log('[URI-to-Markdown] 找到文本数量:', allTexts.length);
          console.log('[URI-to-Markdown] 前 30 个文本:', allTexts.slice(0, 30));
          
          // 配对字段名和值
          let currentRegion = '';
          for (const text of allTexts) {
            // 检测区域标题
            if (text.includes('█') || text.includes('▓')) {
              const regionName = text.replace(/[█▓]/g, '').trim();
              const matchedRegion = regions.find(r => regionName.includes(r));
              if (matchedRegion) {
                currentRegion = matchedRegion;
                if (!fields[currentRegion]) fields[currentRegion] = {};
                console.log('[URI-to-Markdown] 找到区域:', currentRegion);
              }
              continue;
            }
            
            // 跳过说明文字
            if (text.startsWith('注：') || text.startsWith('说明：') || text.match(/^\d+、/)) continue;
            
            // 尝试提取 字段名：字段值
            const kvMatch = text.match(/^([^:：]{2,30})[:：]\s*(.+)$/);
            if (kvMatch) {
              const name = kvMatch[1].trim();
              const value = kvMatch[2].trim();
              
              if (name.length > 1 && name.length < 50) {
                // 匹配区域
                if (!currentRegion) {
                  for (const region of regions) {
                    if (name.includes(region.split(' ')[0])) {
                      currentRegion = region;
                      if (!fields[currentRegion]) fields[currentRegion] = {};
                      break;
                    }
                  }
                }
                
                if (currentRegion) {
                  fields[currentRegion][name] = value;
                }
              }
            }
          }
          
          // 备用方案：正则提取
          if (Object.keys(fields).length === 0) {
            console.log('[URI-to-Markdown] 使用备用方案：正则提取');
            const html = request.html;
            const kvPattern = /([^：:\n]{2,30})[：:]\s*([^\n：:]{1,100})/g;
            let match;
            while ((match = kvPattern.exec(html)) !== null) {
              const name = match[1].trim();
              const value = match[2].trim();
              for (const region of regions) {
                if (name.includes(region.split(' ')[0])) {
                  if (!fields[region]) fields[region] = {};
                  fields[region][name] = value;
                  break;
                }
              }
            }
          }
          
          fieldsMarkdown = formatFieldsAsMarkdown(fields);
          console.log('[URI-to-Markdown] 提取到字段区域:', Object.keys(fields).length);
          console.log('[URI-to-Markdown] 字段详情:', fields);
        } catch (e) {
          console.error('[URI-to-Markdown] 字段提取失败:', e);
        }
      }
      
      let finalMarkdown = markdown || '';
      if (fieldsMarkdown) {
        finalMarkdown += '\n\n---\n\n## 表单字段详情\n\n' + fieldsMarkdown;
      }
      
      sendResponse({ success: true, markdown: finalMarkdown, meta });
    }
  } catch (error) {
    console.error('[URI-to-Markdown] 错误:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : '操作失败' });
  }
  return true;
});
