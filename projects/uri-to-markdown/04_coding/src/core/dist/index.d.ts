import { ConvertOptions, ConvertResult } from './types';
/**
 * URI to Markdown 核心库
 *
 * 将网页 HTML 转换为 Markdown 格式
 * 支持登录认证、多 iframe 合并、表单字段提取
 */
export declare class UriToMarkdown {
    private browserManager;
    private navigator;
    private frameExtractor;
    private transformer;
    private formParser;
    private attachmentParser;
    private configManager;
    constructor();
    /**
     * 转换单个 URL
     */
    convert(url: string, options?: ConvertOptions): Promise<ConvertResult>;
    /**
     * 加载配置文件
     */
    loadConfig(configPath?: string): Promise<void>;
    /**
     * 关闭浏览器
     */
    close(): Promise<void>;
}
export * from './types';
export { BrowserManager } from './browser/BrowserManager';
export { FrameExtractor } from './browser/FrameExtractor';
export { Transformer } from './transformer/Transformer';
export { FormParser } from './parser/FormParser';
export { AttachmentParser } from './parser/AttachmentParser';
export { ConfigManager } from './config/ConfigManager';
export default UriToMarkdown;
//# sourceMappingURL=index.d.ts.map