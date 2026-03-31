import { Page } from 'playwright';
import { Attachment } from '../types';
/**
 * 附件解析器
 *
 * 提取附件文件名、大小
 * 识别批量下载 URL
 */
export declare class AttachmentParser {
    /**
     * 提取附件列表
     */
    extractAttachments(page: Page): Promise<Attachment[]>;
    /**
     * 解析单个附件项
     */
    private parseAttachmentItem;
    /**
     * 生成批量下载 URL
     *
     * 致远 OA 批量下载接口格式：
     * /rest/attachment/file/batchDownload/{fileIds}?zipFileName={name}
     */
    generateBatchDownloadUrl(fileIds: string[], zipFileName?: string): string;
    /**
     * 格式化附件列表为 Markdown
     */
    formatAttachmentsAsMarkdown(attachments: Attachment[]): string;
    /**
     * 提取文件 ID 列表（用于批量下载）
     */
    extractFileIds(attachments: Attachment[]): string[];
}
//# sourceMappingURL=AttachmentParser.d.ts.map