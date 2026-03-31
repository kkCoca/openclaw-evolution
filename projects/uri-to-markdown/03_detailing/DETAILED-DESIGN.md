# 详细设计文档 (DETAILED-DESIGN) - URI to Markdown

> **版本**: v1.0.0  
> **日期**: 2026-03-30  
> **状态**: 已批准 ✅

---

## 1. 核心库详细设计

### 1.1 类型定义

```typescript
// src/core/types/index.ts

// 主配置
export interface AppConfig {
  global: GlobalConfig;
  sites: SiteConfig[];
  chromeExtension?: ChromeExtensionConfig;
}

export interface GlobalConfig {
  timeout: number;
  retryCount: number;
  outputFormat: 'markdown' | 'markdown+meta';
  imageHandling: 'keep-url' | 'download' | 'ignore';
}

export interface SiteConfig {
  domain: string;
  loginUrl?: string;
  username?: string;
  password?: string;
  loginMethod?: 'form' | 'api' | 'oauth';
  selectors?: LoginSelectors;
}

export interface LoginSelectors {
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
}

export interface ChromeExtensionConfig {
  showMetaByDefault: boolean;
  downloadPath: string;
  shortcut: string;
}

// 转换结果
export interface ConvertResult {
  markdown: string;
  meta?: PageMeta;
  attachments?: Attachment[];
  tables?: Table[];
  fields?: FormField[];
}

export interface PageMeta {
  title: string;
  author?: string;
  date?: string;
  url: string;
  convertedAt: string;
}

export interface Attachment {
  name: string;
  size: string;
  url: string | null;
  needsManualDownload: boolean;
  batchDownloadUrl?: string;
}

export interface Table {
  headers: string[];
  rows: string[][];
}

export interface FormField {
  name: string;
  value: string;
  region?: string;
}

// 转换选项
export interface ConvertOptions {
  withMeta?: boolean;
  withAttachments?: boolean;
  withTables?: boolean;
  withFields?: boolean;
  siteConfig?: string;
}
```

### 1.2 BrowserManager 实现

```typescript
// src/core/browser/BrowserManager.ts

import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface BrowserConfig {
  headless?: boolean;
  userDataDir?: string;
  proxy?: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: BrowserConfig;

  constructor(config: BrowserConfig = {}) {
    this.config = {
      headless: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    this.browser = await chromium.launch({
      headless: this.config.headless,
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }

  async createPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser not initialized');
    }
    return this.context.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }
}
```

### 1.3 PageNavigator 实现

```typescript
// src/core/browser/PageNavigator.ts

import { Page } from 'playwright';
import { SiteConfig, Credentials } from '../types';

export class PageNavigator {
  async navigate(page: Page, url: string, siteConfig?: SiteConfig): Promise<void> {
    if (siteConfig?.loginUrl) {
      await this.formLogin(page, siteConfig.loginUrl, {
        username: siteConfig.username!,
        password: siteConfig.password!,
        selectors: siteConfig.selectors
      });
    }

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  }

  async formLogin(
    page: Page,
    loginUrl: string,
    credentials: Credentials
  ): Promise<void> {
    await page.goto(loginUrl);

    const selectors = credentials.selectors || {
      usernameSelector: '#login_username',
      passwordSelector: '#login_password1',
      submitSelector: '#login_button'
    };

    await page.fill(selectors.usernameSelector, credentials.username);
    await page.fill(selectors.passwordSelector, credentials.password);
    await page.click(selectors.submitSelector);

    await page.waitForLoadState('networkidle');
  }
}
```

### 1.4 FrameExtractor 实现

```typescript
// src/core/browser/FrameExtractor.ts

import { Page, Frame } from 'playwright';

export interface FrameInfo {
  frame: Frame;
  url: string;
  textLength: number;
  hasContent: boolean;
}

export interface FrameContent {
  url: string;
  html: string;
  text: string;
  textLength: number;
}

export class FrameExtractor {
  async detectFrames(page: Page): Promise<FrameInfo[]> {
    const frames = page.frames();
    const frameInfos: FrameInfo[] = [];

    for (const frame of frames) {
      try {
        const textLength = await frame.evaluate(
          () => document.body?.innerText?.length || 0
        );

        frameInfos.push({
          frame,
          url: frame.url(),
          textLength,
          hasContent: textLength > 0
        });
      } catch (error) {
        // Frame 可能无法访问，跳过
        frameInfos.push({
          frame,
          url: frame.url(),
          textLength: 0,
          hasContent: false
        });
      }
    }

    return frameInfos;
  }

  async extractContentFrames(page: Page): Promise<FrameContent[]> {
    const frameInfos = await this.detectFrames(page);
    const contentFrames = frameInfos.filter(f => f.hasContent);

    const contents: FrameContent[] = [];
    for (const info of contentFrames) {
      const html = await info.frame.content();
      const text = await info.frame.evaluate(
        () => document.body?.innerText || ''
      );

      contents.push({
        url: info.url,
        html,
        text,
        textLength: info.textLength
      });
    }

    return contents;
  }

  mergeFrameContents(frames: FrameContent[]): string {
    // 按 URL 特征排序：collaboration.do 在前，cap4/form 在后
    const sortedFrames = frames.sort((a, b) => {
      if (a.url.includes('collaboration.do')) return -1;
      if (b.url.includes('collaboration.do')) return 1;
      if (a.url.includes('cap4/form')) return 1;
      if (b.url.includes('cap4/form')) return -1;
      return 0;
    });

    return sortedFrames
      .map(f => f.html)
      .join('\n\n<!-- FRAME_SEPARATOR -->\n\n');
  }
}
```

### 1.5 Transformer 实现

```typescript
// src/core/transformer/Transformer.ts

import TurndownService from 'turndown';
import { PageMeta, Table, ConvertResult } from '../types';

export interface TransformOptions {
  withMeta?: boolean;
  headingStyle?: 'atx' | 'setext';
  codeBlockStyle?: 'fenced' | 'indented';
}

export class Transformer {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      hr: '---',
      bulletListMarker: '-',
    });

    this.addCustomRules();
  }

  private addCustomRules(): void {
    // 移除 script/style 标签
    this.turndownService.remove(['script', 'style']);

    // 自定义表格处理
    this.turndownService.addRule('table', {
      filter: 'table',
      replacement: (content, node) => {
        return this.convertTable(node as HTMLTableElement);
      }
    });
  }

  async transform(html: string, options?: TransformOptions): Promise<string> {
    const markdown = this.turndownService.turndown(html);
    
    if (options?.withMeta) {
      // 后续添加元数据
    }

    return markdown;
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

    return this.markdownTable(markdownRows);
  }

  private markdownTable(rows: string[][]): string {
    if (rows.length === 0) return '';

    const header = rows[0];
    const separator = header.map(() => '---').join(' | ');
    const body = rows.slice(1).map(row => row.join(' | ')).join('\n');

    return `${header.join(' | ')}\n${separator}\n${body}`;
  }

  extractMeta(document: Document): PageMeta {
    return {
      title: document.title,
      author: document.querySelector('meta[name="author"]')?.getAttribute('content') || undefined,
      date: document.querySelector('meta[name="date"]')?.getAttribute('content') || undefined,
      url: document.URL,
      convertedAt: new Date().toISOString()
    };
  }
}
```

### 1.6 FormParser 实现（致远 OA 82 字段）

```typescript
// src/core/parser/FormParser.ts

import { Page, Frame } from 'playwright';
import { FormField } from '../types';

export interface TableCell {
  text: string;
  row: number;
  col: number;
}

export class FormParser {
  // 16 个区域定义
  private readonly regions = [
    'BUG 单期限信息',
    '上报人信息',
    '客户信息',
    '联系人信息',
    '问题描述信息',
    '开发人员填写',
    '备注说明',
    '补丁包相关',
    '核心代码',
    '转客开处理',
    '代码检查结果',
    '诊断结论',
    '测试人员填写',
    '客开人员填写信息',
    '区域客开',
    '发起人交付信息'
  ];

  async extractFields(page: Page): Promise<FormField[]> {
    const fields: FormField[] = [];

    // 获取所有 iframe
    const frames = page.frames();
    
    // 找到包含表单的 frame（cap4/form）
    const formFrame = frames.find(f => f.url().includes('cap4/form'));
    if (!formFrame) {
      return fields;
    }

    // 提取所有表格
    const tables = await formFrame.$$('table');
    
    for (const table of tables) {
      const rows = await table.$$('tr');
      
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const cells = await rows[rowIndex].$$('td, th');
        const cellTexts: string[] = [];
        
        for (const cell of cells) {
          const text = await cell.textContent() || '';
          cellTexts.push(text.trim());
        }

        // 配对字段
        const pairedFields = this.pairFields(cellTexts, rowIndex);
        fields.push(...pairedFields);
      }
    }

    return fields;
  }

  private pairFields(cells: string[], rowIndex: number): FormField[] {
    const fields: FormField[] = [];
    let currentRegion = '';

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      // 跳过空单元格
      if (!cell || cell.trim() === '') {
        continue;
      }

      // 检测区域标题
      if (cell.includes('█')) {
        currentRegion = cell.replace('█', '').trim();
        continue;
      }

      // 跳过说明文字
      if (cell.startsWith('注：') || cell.match(/^\d+、/)) {
        continue;
      }

      // 判断布局模式并配对
      if (this.isLeftRightLayout(cells, i)) {
        // 左右结构：字段名 | 字段值
        const name = cell;
        const value = cells[i + 1] || '';
        fields.push({ name, value, region: currentRegion });
        i++; // 跳过已配对的字段值
      } else {
        // 上下结构：需要跨行配对（简化处理）
        fields.push({ name: cell, value: '', region: currentRegion });
      }
    }

    return fields;
  }

  private isLeftRightLayout(cells: string[], currentIndex: number): boolean {
    // 如果当前行有偶数个单元格，且下一个单元格非空，则是左右结构
    return currentIndex % 2 === 0 && 
           currentIndex + 1 < cells.length && 
           cells[currentIndex + 1]?.trim() !== '';
  }
}
```

### 1.7 AttachmentParser 实现

```typescript
// src/core/parser/AttachmentParser.ts

import { Page } from 'playwright';
import { Attachment } from '../types';

export class AttachmentParser {
  async extractAttachments(page: Page): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    // 查找附件区域
    const attachmentAreas = await page.$$('.attachment-area, .file-list');
    
    for (const area of attachmentAreas) {
      const items = await area.$$('.attachment-item, .file-item');
      
      for (const item of items) {
        try {
          const name = await item.$eval('.file-name, .file-title', 
            el => el.textContent?.trim() || ''
          );
          
          const size = await item.$eval('.file-size, .size', 
            el => el.textContent?.trim() || ''
          );

          // 致远 OA 中 href 通常为空
          const href = await item.$eval('a', 
            el => el.getAttribute('href') || ''
          );

          attachments.push({
            name,
            size,
            url: href || null,
            needsManualDownload: !href
          });
        } catch (error) {
          // 跳过无法解析的附件项
          continue;
        }
      }
    }

    return attachments;
  }

  generateBatchDownloadUrl(fileIds: string[], zipFileName?: string): string {
    const ids = fileIds.join(',');
    const name = zipFileName || 'attachments.zip';
    return `/rest/attachment/file/batchDownload/${ids}?zipFileName=${encodeURIComponent(name)}`;
  }
}
```

### 1.8 ConfigManager 实现

```typescript
// src/core/config/ConfigManager.ts

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { AppConfig, SiteConfig } from '../types';

export class ConfigManager {
  private config: AppConfig | null = null;
  private configPath?: string;

  async load(configPath?: string): Promise<void> {
    this.configPath = configPath || this.getDefaultConfigPath();
    
    const content = fs.readFileSync(this.configPath, 'utf-8');
    const rawConfig = yaml.load(content) as any;
    
    this.config = this.resolveEnvVariables(rawConfig);
  }

  private resolveEnvVariables(config: any): AppConfig {
    const resolved = { ...config };
    
    if (config.sites) {
      resolved.sites = config.sites.map((site: any) => ({
        ...site,
        username: this.resolveEnv(site.username),
        password: this.resolveEnv(site.password)
      }));
    }

    return resolved;
  }

  private resolveEnv(value: string): string {
    if (!value) return value;
    
    const match = value.match(/^\$\{(.+)\}$/);
    if (match) {
      const envValue = process.env[match[1]];
      if (!envValue) {
        throw new Error(`环境变量 ${match[1]} 未设置`);
      }
      return envValue;
    }
    
    return value;
  }

  getSiteConfig(domain: string): SiteConfig | undefined {
    if (!this.config) {
      throw new Error('Config not loaded');
    }

    return this.config.sites.find(site => site.domain === domain);
  }

  private getDefaultConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    return `${homeDir}/.uri2md/config.yaml`;
  }
}
```

### 1.9 主入口实现

```typescript
// src/core/index.ts

import { BrowserManager } from './browser/BrowserManager';
import { PageNavigator } from './browser/PageNavigator';
import { FrameExtractor } from './browser/FrameExtractor';
import { Transformer } from './transformer/Transformer';
import { FormParser } from './parser/FormParser';
import { AttachmentParser } from './parser/AttachmentParser';
import { ConfigManager } from './config/ConfigManager';
import { ConvertOptions, ConvertResult } from './types';

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

  async convert(url: string, options?: ConvertOptions): Promise<ConvertResult> {
    await this.browserManager.initialize();
    
    const page = await this.browserManager.createPage();
    
    try {
      // 1. 获取站点配置
      const domain = new URL(url).hostname;
      const siteConfig = this.configManager.getSiteConfig(domain);

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
      const meta = options?.withMeta 
        ? await page.evaluate(() => ({
            title: document.title,
            url: document.URL
          }))
        : undefined;

      // 6. 提取附件
      const attachments = options?.withAttachments
        ? await this.attachmentParser.extractAttachments(page)
        : undefined;

      // 7. 提取表单字段（致远 OA）
      const fields = options?.withFields
        ? await this.formParser.extractFields(page)
        : undefined;

      return {
        markdown,
        meta: meta as any,
        attachments,
        fields
      };
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    await this.browserManager.close();
  }
}

export * from './types';
```

---

## 2. Chrome 插件详细设计

### 2.1 popup.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { width: 400px; padding: 16px; font-family: sans-serif; }
    .header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .header img { width: 24px; height: 24px; }
    .header h1 { font-size: 16px; margin: 0; }
    .options { margin-bottom: 16px; }
    .options label { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    button { width: 100%; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { background: #ccc; }
    .preview { margin-top: 16px; max-height: 300px; overflow: auto; border: 1px solid #ddd; padding: 8px; }
    .actions { display: flex; gap: 8px; margin-top: 8px; }
    .actions button { flex: 1; }
  </style>
</head>
<body>
  <div class="header">
    <img src="../icons/icon-48.png" alt="icon">
    <h1>URI to Markdown</h1>
  </div>

  <div class="options">
    <label>
      <input type="checkbox" id="withMeta" checked>
      包含元数据
    </label>
    <label>
      <input type="checkbox" id="withAttachments" checked>
      包含附件列表
    </label>
  </div>

  <button id="convertBtn">转换</button>

  <div class="preview" id="preview" style="display: none;">
    <pre id="previewContent"></pre>
  </div>

  <div class="actions" id="actions" style="display: none;">
    <button id="copyBtn">复制</button>
    <button id="downloadBtn">下载</button>
  </div>

  <script src="../popup/popup.js"></script>
</body>
</html>
```

### 2.2 popup.ts

```typescript
// src/chrome-extension/popup/popup.ts

document.getElementById('convertBtn')?.addEventListener('click', async () => {
  const convertBtn = document.getElementById('convertBtn') as HTMLButtonElement;
  const preview = document.getElementById('preview')!;
  const previewContent = document.getElementById('previewContent')!;
  const actions = document.getElementById('actions')!;

  convertBtn.disabled = true;
  convertBtn.textContent = '转换中...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab');
    }

    // 发送消息到 content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'getPageHtml'
    });

    // 调用 background script 进行转换
    const result = await chrome.runtime.sendMessage({
      action: 'convert',
      html: response.html,
      url: tab.url,
      options: {
        withMeta: (document.getElementById('withMeta') as HTMLInputElement).checked,
        withAttachments: (document.getElementById('withAttachments') as HTMLInputElement).checked
      }
    });

    // 显示预览
    previewContent.textContent = result.markdown;
    preview.style.display = 'block';
    actions.style.display = 'flex';

    // 存储结果供下载
    (window as any).convertResult = result;
  } catch (error) {
    alert(`转换失败：${error}`);
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = '转换';
  }
});

document.getElementById('copyBtn')?.addEventListener('click', () => {
  const result = (window as any).convertResult;
  navigator.clipboard.writeText(result.markdown);
  alert('已复制到剪贴板');
});

document.getElementById('downloadBtn')?.addEventListener('click', () => {
  const result = (window as any).convertResult;
  const blob = new Blob([result.markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${new Date().getTime()}.md`;
  a.click();
  
  URL.revokeObjectURL(url);
});
```

---

## 3. CLI 工具详细设计

### 3.1 index.ts

```typescript
#!/usr/bin/env node

// src/cli/index.ts

import { Command } from 'commander';
import { convertCommand } from './commands/convert';
import { batchCommand } from './commands/batch';
import { loginCommand } from './commands/login';

const program = new Command();

program
  .name('uri2md')
  .description('将网页转换为 Markdown 格式')
  .version('1.0.0');

program
  .command('convert <url>')
  .description('转换单个 URL')
  .option('-c, --config <path>', '配置文件路径')
  .option('-o, --output <path>', '输出文件路径')
  .option('--with-meta', '包含元数据')
  .option('--with-attachments', '包含附件列表')
  .action(convertCommand);

program
  .command('batch <file>')
  .description('批量转换（从文件读取 URL 列表）')
  .option('-c, --config <path>', '配置文件路径')
  .option('-o, --output-dir <path>', '输出目录')
  .option('--concurrency <n>', '并发数', '1')
  .action(batchCommand);

program
  .command('login <site>')
  .description('测试登录指定站点')
  .option('-c, --config <path>', '配置文件路径')
  .action(loginCommand);

program.parse();
```

---

## 4. 测试策略

### 4.1 单元测试

| 模块 | 测试用例 | 覆盖目标 |
|------|---------|---------|
| FrameExtractor | 检测空/有内容 iframe | 100% |
| FormParser | 左右/上下布局配对 | 100% |
| AttachmentParser | 提取文件名/大小 | 100% |
| ConfigManager | 环境变量解析 | 100% |

### 4.2 集成测试

| 场景 | 测试内容 |
|------|---------|
| 致远 OA 登录 | 表单登录成功 |
| 多 iframe 合并 | Frame 2 + Frame 4 内容完整 |
| 82 字段提取 | 所有字段正确配对 |
| 附件列表 | 文件名 + 大小完整 |

### 4.3 端到端测试

| 流程 | 验证点 |
|------|--------|
| Chrome 插件 | 点击→转换→预览→下载 |
| CLI | 命令执行→文件输出 |
| 核心库 | API 调用→结果返回 |

---

## 5. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-30 | 初始版本（全新功能） |

---

*DETAILED-DESIGN.md 由流程引擎生成，指导具体实现*
