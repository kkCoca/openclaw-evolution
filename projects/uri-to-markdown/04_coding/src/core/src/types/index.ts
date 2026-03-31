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

export interface Credentials {
  username: string;
  password: string;
  selectors?: LoginSelectors;
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

export interface TransformOptions {
  withMeta?: boolean;
}

// 批量转换
export interface BatchOptions extends ConvertOptions {
  outputDir?: string;
  concurrency?: number;
}

export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  results: BatchItemResult[];
}

export interface BatchItemResult {
  url: string;
  success: boolean;
  error?: string;
  outputFile?: string;
}

// iframe 相关
export interface FrameInfo {
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
