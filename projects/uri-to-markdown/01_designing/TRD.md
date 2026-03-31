# 技术设计文档 (TRD) - URI to Markdown

> **版本**: v1.0.0  
> **日期**: 2026-03-30  
> **状态**: 已批准 ✅

---

## 1. 技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      消费层 (Consumer Layer)                 │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Chrome 插件    │    CLI 工具     │      HTTP API           │
│  (Browser)      │    (Node.js)    │      (Node.js)          │
└────────┬────────┴────────┬────────┴──────────┬──────────────┘
         │                 │                    │
         └─────────────────┼────────────────────┘
                           │ 依赖
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心层 (Core Layer)                     │
│                   uri-to-markdown-core                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Browser    │  │  Config     │  │  Transformer        │  │
│  │  Automation │  │  Manager    │  │  Engine             │  │
│  │  (Playwright│  │  (yaml)     │  │  (Turndown)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术选型

| 组件 | 技术 | 选型理由 |
|------|------|---------|
| **核心库** | TypeScript | 类型安全，支持 Node.js/Browser |
| **浏览器自动化** | Playwright | 跨浏览器，支持 iframe，API 完善 |
| **HTML 转 Markdown** | Turndown | 成熟稳定，可自定义规则 |
| **配置解析** | js-yaml | 轻量，支持环境变量 |
| **CLI** | Commander.js | 事实标准，易用 |
| **HTTP API** | Fastify | 高性能，低延迟 |
| **Chrome 插件** | Manifest V3 | 最新标准，长期支持 |

---

## 2. 核心模块设计

### 2.1 核心库 (uri-to-markdown-core)

#### 2.1.1 模块结构

```
src/core/
├── index.ts              # 主入口，导出公共 API
├── browser/
│   ├── BrowserManager.ts # 浏览器实例管理
│   ├── PageNavigator.ts  # 页面导航和登录
│   └── FrameExtractor.ts # iframe 内容提取
├── transformer/
│   ├── Transformer.ts    # HTML 转 Markdown 主引擎
│   ├── TurndownService.ts# Turndown 配置和规则
│   └── MetaExtractor.ts  # 元数据提取
├── parser/
│   ├── FormParser.ts     # 表单字段解析（致远 OA）
│   ├── TableParser.ts    # 表格解析
│   └── AttachmentParser.ts# 附件解析
├── config/
│   ├── ConfigManager.ts  # 配置加载和管理
│   └── SiteConfig.ts     # 站点配置类型定义
└── utils/
    ├── logger.ts         # 日志工具（脱敏）
    └── retry.ts          # 重试工具
```

#### 2.1.2 核心 API

```typescript
// 主入口 API
interface UriToMarkdown {
  // 转换单个 URL
  convert(url: string, options?: ConvertOptions): Promise<ConvertResult>;
  
  // 批量转换
  convertBatch(urls: string[], options?: BatchOptions): Promise<BatchResult>;
  
  // 登录指定站点
  login(siteConfig: SiteConfig): Promise<Cookie[]>;
}

// 转换结果
interface ConvertResult {
  markdown: string;       // Markdown 内容
  meta?: PageMeta;        // 元数据（可选）
  attachments?: Attachment[]; // 附件列表
  tables?: Table[];       // 表格数据
  fields?: FormField[];   // 表单字段（致远 OA）
}

// 页面元数据
interface PageMeta {
  title: string;
  author?: string;
  date?: string;
  url: string;
  convertedAt: string;
}
```

### 2.2 浏览器自动化模块

#### 2.2.1 BrowserManager

```typescript
class BrowserManager {
  private browser: Browser;
  private context: BrowserContext;
  
  // 初始化浏览器（支持配置）
  async initialize(config: BrowserConfig): Promise<void>;
  
  // 创建新页面
  async createPage(): Promise<Page>;
  
  // 关闭浏览器
  async close(): Promise<void>;
}
```

#### 2.2.2 PageNavigator

```typescript
class PageNavigator {
  // 导航到 URL（自动处理登录）
  async navigate(page: Page, url: string, siteConfig?: SiteConfig): Promise<void>;
  
  // 执行表单登录
  async formLogin(page: Page, loginUrl: string, credentials: Credentials): Promise<void>;
  
  // 等待页面加载完成
  async waitForLoad(page: Page, options?: WaitForOptions): Promise<void>;
}
```

#### 2.2.3 FrameExtractor

```typescript
class FrameExtractor {
  // 检测所有 iframe
  async detectFrames(page: Page): Promise<FrameInfo[]>;
  
  // 提取有内容的 iframe
  async extractContentFrames(page: Page): Promise<FrameContent[]>;
  
  // 合并多个 iframe 内容
  mergeFrameContents(frames: FrameContent[]): string;
}
```

### 2.3 Transformer 模块

#### 2.3.1 Transformer

```typescript
class Transformer {
  private turndownService: TurndownService;
  
  // HTML 转 Markdown
  async transform(html: string, options?: TransformOptions): Promise<string>;
  
  // 提取元数据
  extractMeta(document: Document): PageMeta;
  
  // 清理 HTML（移除导航/广告）
  cleanHtml(html: string): string;
}
```

#### 2.3.2 致远 OA 特殊处理

```typescript
class ZhiyuanOAProcessor {
  // 提取 82 个字段
  async extractFields(page: Page): Promise<FormField[]>;
  
  // 字段配对（左右/上下布局）
  pairFields(cells: TableCell[]): FormField[];
  
  // 提取附件列表
  async extractAttachments(page: Page): Promise<Attachment[]>;
  
  // 生成批量下载 URL
  generateBatchDownloadUrl(fileIds: string[]): string;
}
```

### 2.4 配置管理模块

#### 2.4.1 ConfigManager

```typescript
class ConfigManager {
  private config: AppConfig;
  
  // 加载配置（支持文件 + 环境变量）
  async load(configPath?: string): Promise<void>;
  
  // 获取站点配置
  getSiteConfig(domain: string): SiteConfig | undefined;
  
  // 解析环境变量引用
  resolveEnvVariables(value: string): string;
}
```

---

## 3. 关键算法设计

### 3.1 多 iframe 合并算法

```typescript
async function mergeIframes(page: Page): Promise<string> {
  // 1. 获取所有 iframe
  const frames = page.frames();
  
  // 2. 过滤有内容的 iframe
  const contentFrames = await Promise.all(
    frames.map(async (frame) => {
      const content = await frame.content();
      const textLength = await frame.evaluate(() => document.body.innerText.length);
      return { frame, content, textLength };
    })
  ).then(results => 
    results.filter(r => r.textLength > 0)
  );
  
  // 3. 按逻辑顺序排序（根据 URL 或内容特征）
  const sortedFrames = contentFrames.sort((a, b) => {
    // Frame 2 (collaboration.do) 在前，Frame 4 (cap4/form) 在后
    if (a.frame.url().includes('collaboration.do')) return -1;
    if (b.frame.url().includes('collaboration.do')) return 1;
    if (a.frame.url().includes('cap4/form')) return 1;
    return 0;
  });
  
  // 4. 合并内容
  return sortedFrames.map(f => f.content).join('\n\n');
}
```

### 3.2 字段配对算法（致远 OA）

```typescript
function pairFields(cells: TableCell[]): FormField[] {
  const fields: FormField[] = [];
  let i = 0;
  
  while (i < cells.length) {
    const cell = cells[i];
    
    // 跳过空单元格
    if (isEmpty(cell)) {
      i++;
      continue;
    }
    
    // 跳过区域标题（含 █ 符号）
    if (isRegionTitle(cell)) {
      i++;
      continue;
    }
    
    // 跳过说明文字
    if (isNoteText(cell)) {
      i++;
      continue;
    }
    
    // 判断布局模式
    if (isLeftRightLayout(cell)) {
      // 左右结构：字段名 | 字段值 | 字段名 | 字段值
      fields.push({ name: cell.text, value: cells[i + 1]?.text || '' });
      fields.push({ name: cells[i + 2]?.text || '', value: cells[i + 3]?.text || '' });
      i += 4;
    } else {
      // 上下结构：字段名 \n 字段值
      fields.push({ name: cell.text, value: cells[i + 1]?.text || '' });
      i += 2;
    }
  }
  
  return fields;
}

// 辅助函数
function isEmpty(cell: TableCell): boolean {
  return !cell.text || cell.text.trim() === '';
}

function isRegionTitle(cell: TableCell): boolean {
  return cell.text.includes('█');
}

function isNoteText(cell: TableCell): boolean {
  return cell.text.startsWith('注：') || 
         cell.text.match(/^\d+、/);
}

function isLeftRightLayout(cell: TableCell): boolean {
  // 根据表格结构判断
  // 如果同一行有 4 个单元格，则是左右结构
  return cell.row.cells.length >= 4;
}
```

### 3.3 附件提取算法

```typescript
async function extractAttachments(page: Page): Promise<Attachment[]> {
  const attachments: Attachment[] = [];
  
  // 1. 定位附件区域
  const attachmentArea = await page.$('.attachment-area');
  if (!attachmentArea) return attachments;
  
  // 2. 提取所有附件项
  const items = await attachmentArea.$$('.attachment-item');
  for (const item of items) {
    const name = await item.$eval('.file-name', el => el.textContent?.trim() || '');
    const size = await item.$eval('.file-size', el => el.textContent?.trim() || '');
    
    // 3. 检查下载链接（致远 OA 中 href 为空）
    const downloadLink = await item.$eval('a', el => el.getAttribute('href') || '');
    
    attachments.push({
      name,
      size,
      url: downloadLink || null,
      needsManualDownload: !downloadLink
    });
  }
  
  return attachments;
}
```

---

## 4. Chrome 插件设计

### 4.1 目录结构

```
src/chrome-extension/
├── manifest.json         # Manifest V3 配置
├── popup/
│   ├── popup.html        # 弹出页面
│   ├── popup.ts          # 弹出页面逻辑
│   └── popup.css         # 样式
├── content/
│   └── content.ts        # 内容脚本（读取页面）
├── background/
│   └── background.ts     # 后台脚本（转换逻辑）
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── lib/
    └── uri-to-markdown-core.js  # 核心库（打包后）
```

### 4.2 manifest.json

```json
{
  "manifest_version": 3,
  "name": "URI to Markdown",
  "version": "1.0.0",
  "description": "将任意网页转换为 Markdown 格式",
  "permissions": [
    "activeTab",
    "storage",
    "downloads"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+M"
      }
    }
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

### 4.3 工作流程

```
用户点击图标
    ↓
popup.ts 发送消息到 content.ts
    ↓
content.ts 读取当前页面 HTML
    ↓
发送 HTML 到 background.ts
    ↓
background.ts 调用核心库转换
    ↓
返回 Markdown 到 popup.ts
    ↓
显示预览，支持复制/下载
```

---

## 5. CLI 工具设计

### 5.1 目录结构

```
src/cli/
├── index.ts              # CLI 入口
├── commands/
│   ├── convert.ts        # 单个 URL 转换
│   ├── batch.ts          # 批量转换
│   └── login.ts          # 手动登录测试
├── options/
│   └── global.ts         # 全局选项定义
└── utils/
    └── progress.ts       # 进度条显示
```

### 5.2 命令设计

```bash
# 单个 URL 转换
uri2md <url> [options]

# 批量转换
uri2md --batch <file> [options]

# 登录测试
uri2md login <site> [options]
```

### 5.3 选项设计

```typescript
// 全局选项
interface CliOptions {
  config?: string;        // 配置文件路径
  output?: string;        // 输出文件路径
  outputDir?: string;     // 输出目录（批量）
  withMeta?: boolean;     // 包含元数据
  format?: 'markdown' | 'markdown+meta';
  verbose?: boolean;      // 详细日志
}
```

---

## 6. HTTP API 设计

### 6.1 目录结构

```
src/api/
├── index.ts              # API 入口
├── routes/
│   ├── convert.ts        # /api/convert
│   ├── batch.ts          # /api/batch
│   └── health.ts         # /health
├── middleware/
│   ├── auth.ts           # 认证中间件
│   └── rateLimit.ts      # 限流中间件
└── types/
    └── api.ts            # API 类型定义
```

### 6.2 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/convert` | POST | 转换单个 URL |
| `/api/batch` | POST | 批量转换（异步） |
| `/api/task/:id` | GET | 查询任务状态 |
| `/health` | GET | 健康检查 |

### 6.3 请求/响应示例

```typescript
// POST /api/convert
// 请求
{
  "url": "https://xt.seeyon.com/...",
  "withMeta": true,
  "siteConfig": "xt.seeyon.com"
}

// 响应
{
  "success": true,
  "data": {
    "markdown": "...",
    "meta": {
      "title": "...",
      "author": "...",
      "date": "..."
    },
    "attachments": [...]
  }
}
```

---

## 7. 安全设计

### 7.1 密码保护

```typescript
// 配置解析时自动替换环境变量
function resolveConfig(config: RawConfig): ResolvedConfig {
  return {
    ...config,
    sites: config.sites.map(site => ({
      ...site,
      username: resolveEnv(site.username),  // ${VAR} → 实际值
      password: resolveEnv(site.password)
    }))
  };
}

function resolveEnv(value: string): string {
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
```

### 7.2 日志脱敏

```typescript
function sanitizeLog(obj: any): any {
  const sensitiveKeys = ['password', 'token', 'cookie', 'authorization'];
  
  if (typeof obj === 'string') {
    return sensitiveKeys.reduce((acc, key) => {
      return acc.replace(new RegExp(`${key}=[^&]+`, 'gi'), `${key}=***`);
    }, obj);
  }
  
  if (typeof obj === 'object') {
    const sanitized = { ...obj };
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '***';
      }
    });
    return sanitized;
  }
  
  return obj;
}
```

---

## 8. 错误处理

### 8.1 错误类型

```typescript
enum ErrorCode {
  LOGIN_FAILED = 'LOGIN_FAILED',
  PAGE_NOT_FOUND = 'PAGE_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  CONFIG_ERROR = 'CONFIG_ERROR',
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

class UriToMarkdownError extends Error {
  code: ErrorCode;
  details?: any;
  
  constructor(code: ErrorCode, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
```

### 8.2 重试机制

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000 } = options;
  
  let lastError: Error;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        logger.warn(`重试 ${i + 1}/${maxRetries}: ${error.message}`);
        await sleep(delay * Math.pow(2, i)); // 指数退避
      }
    }
  }
  
  throw lastError!;
}
```

---

## 9. 依赖管理

### 9.1 核心库依赖

```json
{
  "dependencies": {
    "playwright": "^1.40.0",
    "turndown": "^7.1.2",
    "js-yaml": "^4.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/turndown": "^5.0.4",
    "@types/js-yaml": "^4.0.9",
    "vitest": "^1.0.0"
  }
}
```

### 9.2 Chrome 插件依赖

```json
{
  "dependencies": {
    "uri-to-markdown-core": "workspace:*"
  },
  "devDependencies": {
    "chrome-types": "^0.1.0",
    "esbuild": "^0.19.0"
  }
}
```

### 9.3 CLI 工具依赖

```json
{
  "dependencies": {
    "uri-to-markdown-core": "workspace:*",
    "commander": "^11.1.0",
    "cli-progress": "^3.12.0"
  }
}
```

### 9.4 HTTP API 依赖

```json
{
  "dependencies": {
    "uri-to-markdown-core": "workspace:*",
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.4.0"
  }
}
```

---

## 10. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-30 | 初始版本（全新功能） |
| v2.1.2 | 2026-03-31 | Issue #004 修复：Chrome 插件 iframe 内容提取 |

---

## 11. Issue #004 根因分析与修复方案

### 11.1 问题描述

Chrome 插件转换致远 OA 页面时结果为 `undefined`，无法正确提取内容。

### 11.2 根因分析

致远 OA 页面内容在 iframe 中（`cap4/form/dist/index.html`），但 Chrome 插件的 content script 只获取了主页面 HTML，没有提取 iframe 内容，导致转换引擎无内容可处理。

**技术原因**：
- 致远 OA 使用 iframe 嵌套架构
- 主页面是框架容器，实际业务内容在 iframe 内
- 原 content.ts 仅调用 `document.documentElement.outerHTML` 获取主页面
- iframe 内容未被提取，导致转换结果为空

### 11.3 修复方案

#### 11.3.1 修改 content.ts

添加 iframe 内容提取逻辑：

```typescript
// 检测所有 iframe
const iframes = document.querySelectorAll('iframe');

// 提取每个 iframe 的内容
for (const iframe of iframes) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    const content = iframeDoc?.body?.innerHTML || '';
    const textLength = iframeDoc?.body?.textContent?.length || 0;
    
    if (textLength > 0) {
      // 收集有内容的 iframe
      frameContents.push(content);
    }
  } catch (e) {
    // 跨域 iframe 无法访问，跳过
  }
}

// 合并到主 HTML
const mergedHtml = html.replace(
  '</body>',
  '<!-- IFRAME_CONTENT_START -->' + 
  frameContents.join('<hr><!-- FRAME_SEPARATOR -->') +
  '<!-- IFRAME_CONTENT_END --></body>'
);
```

#### 11.3.2 技术要点

1. **同源策略处理**：使用 try-catch 捕获跨域 iframe 访问异常
2. **内容过滤**：只提取有实际内容的 iframe（textContent.length > 0）
3. **标记分隔**：使用 HTML 注释标记 iframe 内容边界，便于后续处理
4. **调试日志**：添加 console.log 便于排查问题

### 11.4 验证结果

- ✅ content.ts 已修改
- ✅ content.js 已重新构建
- ✅ 致远 OA 同源 iframe 可正常访问
- ✅ 跨域 iframe 自动跳过（不报错）
- ✅ iframe 内容合并到主 HTML

### 11.5 影响范围

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `content/content.ts` | 修改 | 添加 iframe 提取逻辑 |
| `content/content.js` | 重新构建 | 编译后的 JS 文件 |
| `TRD.md` | 追加 | 记录根因分析和修复方案 |
| `CHANGELOG.md` | 追加 | v2.1.2 修复记录 |
| `ISSUES.md` | 更新 | #004 状态更新为已修复 |
| `REVIEW-REPORT.md` | 更新 | 记录修复验证 |

---

*TRD.md 由流程引擎生成，追加式记录所有版本设计*
