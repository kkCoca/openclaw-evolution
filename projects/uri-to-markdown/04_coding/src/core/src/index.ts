import { BrowserManager } from './browser/BrowserManager';
import { PageNavigator } from './browser/PageNavigator';
import { FrameExtractor } from './browser/FrameExtractor';
import { Transformer } from './transformer/Transformer';
import { FormParser } from './parser/FormParser';
import { AttachmentParser } from './parser/AttachmentParser';
import { ConfigManager } from './config/ConfigManager';
import { ConvertOptions, ConvertResult, PageMeta, Attachment, FormField } from './types';

/**
 * URI to Markdown 核心库
 * 
 * 将网页 HTML 转换为 Markdown 格式
 * 支持登录认证、多 iframe 合并、表单字段提取
 */
export class UriToMarkdown {
  private browserManager: BrowserManager;
  private navigator: PageNavigator;
  private frameExtractor: FrameExtractor;
  private transformer: Transformer;
  private formParser: FormParser;
  private attachmentParser: AttachmentParser;
  private configManager: ConfigManager;

  constructor() {
    this.browserManager = new BrowserManager();
    this.navigator = new PageNavigator();
    this.frameExtractor = new FrameExtractor();
    this.transformer = new Transformer();
    this.formParser = new FormParser();
    this.attachmentParser = new AttachmentParser();
    this.configManager = new ConfigManager();
  }

  /**
   * 转换单个 URL
   */
  async convert(url: string, options?: ConvertOptions): Promise<ConvertResult> {
    await this.browserManager.initialize();
    
    const page = await this.browserManager.createPage();
    
    try {
      // 1. 获取站点配置
      const domain = new URL(url).hostname;
      const siteConfig = this.configManager.isLoaded() 
        ? this.configManager.getSiteConfig(domain)
        : undefined;

      // 2. 导航到页面（自动登录）
      await this.navigator.navigate(page, url, siteConfig);

      // 3. 提取并合并 iframe 内容
      const frameContents = await this.frameExtractor.extractContentFrames(page);
      const mergedHtml = this.frameExtractor.mergeFrameContents(frameContents);

      // 4. 转换为 Markdown
      const markdown = await this.transformer.transform(mergedHtml, {
        withMeta: options?.withMeta
      });

      // 5. 提取元数据
      let meta: PageMeta | undefined;
      if (options?.withMeta) {
        meta = await page.evaluate(() => ({
          title: document.title,
          author: document.querySelector('meta[name="author"]')?.getAttribute('content') || undefined,
          date: document.querySelector('meta[name="date"]')?.getAttribute('content') || 
                 document.querySelector('meta[name="publishdate"]')?.getAttribute('content') || undefined,
          url: document.URL,
          convertedAt: new Date().toISOString()
        }));
      }

      // 6. 提取附件
      let attachments: Attachment[] | undefined;
      if (options?.withAttachments) {
        attachments = await this.attachmentParser.extractAttachments(page);
      }

      // 7. 提取表单字段（致远 OA）
      let fields: FormField[] | undefined;
      if (options?.withFields) {
        fields = await this.formParser.extractFields(page);
      }

      return {
        markdown,
        meta,
        attachments,
        fields
      };
    } finally {
      await page.close();
    }
  }

  /**
   * 加载配置文件
   */
  async loadConfig(configPath?: string): Promise<void> {
    await this.configManager.load(configPath);
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    await this.browserManager.close();
  }
}

// 导出类型
export * from './types';

// 导出工具类
export { BrowserManager } from './browser/BrowserManager';
export { FrameExtractor } from './browser/FrameExtractor';
export { Transformer } from './transformer/Transformer';
export { FormParser } from './parser/FormParser';
export { AttachmentParser } from './parser/AttachmentParser';
export { ConfigManager } from './config/ConfigManager';

// 默认导出
export default UriToMarkdown;
