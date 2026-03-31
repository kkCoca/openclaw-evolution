import { Page } from 'playwright';
import { Attachment } from '../types';

/**
 * 附件解析器
 * 
 * 提取附件文件名、大小
 * 识别批量下载 URL
 */
export class AttachmentParser {
  /**
   * 提取附件列表
   */
  async extractAttachments(page: Page): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    try {
      // 查找附件区域（多种可能的选择器）
      const attachmentAreas = await page.$$(
        '.attachment-area, .file-list, .attachments, [class*="attachment"]'
      );
      
      for (const area of attachmentAreas) {
        // 查找附件项
        const items = await area.$$(
          '.attachment-item, .file-item, [class*="file-item"]'
        );
        
        for (const item of items) {
          try {
            const attachment = await this.parseAttachmentItem(item);
            if (attachment && attachment.name) {
              attachments.push(attachment);
            }
          } catch (error) {
            // 跳过无法解析的附件项
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error extracting attachments:', error);
    }

    return attachments;
  }

  /**
   * 解析单个附件项
   */
  private async parseAttachmentItem(item: any): Promise<Attachment | null> {
    try {
      // 提取文件名
      const name = await item.$eval(
        '.file-name, .file-title, [class*="file-name"]',
        el => el.textContent?.trim() || ''
      ).catch(() => '');

      // 提取文件大小
      const size = await item.$eval(
        '.file-size, .size, [class*="file-size"]',
        el => el.textContent?.trim() || ''
      ).catch(() => '');

      // 提取下载链接（致远 OA 中通常为空）
      const href = await item.$eval('a', 
        el => el.getAttribute('href') || ''
      ).catch(() => '');

      return {
        name,
        size,
        url: href || null,
        needsManualDownload: !href || href === ''
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 生成批量下载 URL
   * 
   * 致远 OA 批量下载接口格式：
   * /rest/attachment/file/batchDownload/{fileIds}?zipFileName={name}
   */
  generateBatchDownloadUrl(fileIds: string[], zipFileName?: string): string {
    if (fileIds.length === 0) {
      return '';
    }

    const ids = fileIds.join(',');
    const name = zipFileName || `attachments_${Date.now()}.zip`;
    
    return `/rest/attachment/file/batchDownload/${ids}?zipFileName=${encodeURIComponent(name)}`;
  }

  /**
   * 格式化附件列表为 Markdown
   */
  formatAttachmentsAsMarkdown(attachments: Attachment[]): string {
    if (attachments.length === 0) {
      return '## 附件\n\n无附件\n';
    }

    const lines = ['## 附件\n'];
    lines.push('| 文件名 | 大小 | 下载 |');
    lines.push('|--------|------|------|');

    for (const attachment of attachments) {
      const downloadText = attachment.needsManualDownload
        ? '需手动下载'
        : `[下载](${attachment.url})`;

      lines.push(
        `| ${attachment.name} | ${attachment.size} | ${downloadText} |`
      );
    }

    // 添加批量下载提示
    if (attachments.some(a => a.needsManualDownload)) {
      lines.push('');
      lines.push('> **提示**: 部分附件需要手动下载，或联系管理员获取批量下载权限');
    }

    return lines.join('\n');
  }

  /**
   * 提取文件 ID 列表（用于批量下载）
   */
  extractFileIds(attachments: Attachment[]): string[] {
    return attachments
      .map(a => {
        // 从 URL 中提取 file ID（如果有）
        if (a.url) {
          const match = a.url.match(/fileId=([^&]+)/);
          if (match) return match[1];
        }
        return null;
      })
      .filter((id): id is string => id !== null);
  }
}
