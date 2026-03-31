import { describe, it, expect } from 'vitest';
import { AttachmentParser } from '../../src/core/src/parser/AttachmentParser';

describe('AttachmentParser', () => {
  const parser = new AttachmentParser();

  describe('generateBatchDownloadUrl', () => {
    it('应该生成正确的批量下载 URL', () => {
      const fileIds = ['file1', 'file2', 'file3'];
      const url = parser.generateBatchDownloadUrl(fileIds, 'attachments.zip');

      expect(url).toContain('/rest/attachment/file/batchDownload/');
      expect(url).toContain('file1,file2,file3');
      expect(url).toContain('zipFileName=attachments.zip');
    });

    it('应该使用默认文件名', () => {
      const fileIds = ['file1'];
      const url = parser.generateBatchDownloadUrl(fileIds);

      expect(url).toContain('zipFileName=attachments_');
    });

    it('空文件 ID 列表应该返回空字符串', () => {
      const url = parser.generateBatchDownloadUrl([]);
      expect(url).toBe('');
    });
  });

  describe('formatAttachmentsAsMarkdown', () => {
    it('应该格式化附件列表为 Markdown 表格', () => {
      const attachments = [
        { name: 'file1.pdf', size: '1.2 MB', url: '/download/1', needsManualDownload: false },
        { name: 'file2.docx', size: '500 KB', url: null, needsManualDownload: true }
      ];

      const markdown = parser.formatAttachmentsAsMarkdown(attachments);

      expect(markdown).toContain('## 附件');
      expect(markdown).toContain('| 文件名 | 大小 | 下载 |');
      expect(markdown).toContain('| file1.pdf | 1.2 MB |');
      expect(markdown).toContain('| file2.docx | 500 KB | 需手动下载 |');
    });

    it('空列表应该显示无附件', () => {
      const markdown = parser.formatAttachmentsAsMarkdown([]);
      expect(markdown).toContain('无附件');
    });

    it('应该添加批量下载提示', () => {
      const attachments = [
        { name: 'file1.pdf', size: '1.2 MB', url: null, needsManualDownload: true }
      ];

      const markdown = parser.formatAttachmentsAsMarkdown(attachments);

      expect(markdown).toContain('需手动下载');
      expect(markdown).toContain('联系管理员获取批量下载权限');
    });
  });

  describe('extractFileIds', () => {
    it('应该从 URL 中提取文件 ID', () => {
      const attachments = [
        { name: 'file1.pdf', size: '1.2 MB', url: '/download?fileId=123', needsManualDownload: false },
        { name: 'file2.docx', size: '500 KB', url: '/download?fileId=456', needsManualDownload: false }
      ];

      const fileIds = parser.extractFileIds(attachments);

      expect(fileIds).toEqual(['123', '456']);
    });

    it('应该跳过没有 file ID 的附件', () => {
      const attachments = [
        { name: 'file1.pdf', size: '1.2 MB', url: null, needsManualDownload: true },
        { name: 'file2.docx', size: '500 KB', url: '/download', needsManualDownload: false }
      ];

      const fileIds = parser.extractFileIds(attachments);

      expect(fileIds).toEqual([]);
    });
  });
});
