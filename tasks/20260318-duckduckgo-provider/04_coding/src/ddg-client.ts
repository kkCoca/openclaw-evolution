import { ProviderError, type DuckDuckGoClientOptions, type DuckDuckGoClient, type DuckDuckGoSearchRequest } from './types.js';
import { Agent, ProxyAgent } from 'undici';

const DEFAULT_ENDPOINT = 'https://html.duckduckgo.com/html/';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000; // 1 秒基础延迟
const MAX_DELAY_MS = 30_000; // 最大延迟 30 秒

// ============ 反爬对抗：User-Agent 轮换池 ============
const USER_AGENTS = [
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Firefox on Linux
  'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  // Safari on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
];

// ============ 反爬对抗：请求头随机化 ============
const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'zh-CN,zh;q=0.9,en;q=0.8',
  'zh-TW,zh;q=0.9,en;q=0.8',
  'en-GB,en;q=0.9',
  'de-DE,de;q=0.9,en;q=0.8',
  'ja-JP,ja;q=0.9,en;q=0.8',
];

const ACCEPT_ENCODINGS = [
  'gzip, deflate, br',
  'gzip, deflate',
  'gzip, deflate, br, zstd',
];

const SEC_CH_UA_PLATFORMS = [
  '"Linux"',
  '"Windows"',
  '"macOS"',
];

/**
 * 随机选择数组中的一个元素
 */
function randomChoice<T>(array: readonly T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot choose from empty array');
  }
  const index = Math.floor(Math.random() * array.length);
  return array[index] as T;
}

/**
 * 生成随机指纹的请求头
 */
function generateRandomHeaders(): Record<string, string> {
  const userAgent = randomChoice(USER_AGENTS);
  const platform = SEC_CH_UA_PLATFORMS.find(p => userAgent.includes(p.replace(/"/g, ''))) || '"Linux"';
  
  // 从 User-Agent 提取 Chrome 版本号
  const chromeVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || '123';
  const firefoxVersion = userAgent.match(/Firefox\/(\d+)/)?.[1];
  
  return {
    'user-agent': userAgent,
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'accept-language': randomChoice(ACCEPT_LANGUAGES),
    'accept-encoding': randomChoice(ACCEPT_ENCODINGS),
    'content-type': 'application/x-www-form-urlencoded',
    'origin': 'https://html.duckduckgo.com',
    'referer': 'https://html.duckduckgo.com/',
    'sec-ch-ua': firefoxVersion 
      ? `"Not(A:Brand";v="99", "Firefox";v="${firefoxVersion}"`
      : `"Google Chrome";v="${chromeVersion}", "Chromium";v="${chromeVersion}", "Not_A Brand";v="24"`,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': platform,
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'connection': 'keep-alive',
  };
}

// 自动检测系统代理
function getSystemProxy(): string | undefined {
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  return httpsProxy || httpProxy;
}

// 创建带代理的 fetch 实现
function createFetchWithProxy(): typeof fetch {
  const proxyUrl = getSystemProxy();
  
  if (proxyUrl) {
    const dispatcher = new ProxyAgent(proxyUrl);
    // 使用 undici 的 fetch 实现，支持代理
    return (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, { ...init, dispatcher } as any);
    };
  }
  
  return fetch;
}

export class DefaultDuckDuckGoClient implements DuckDuckGoClient {
  private readonly endpoint: URL;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;

  constructor(options: DuckDuckGoClientOptions = {}) {
    this.endpoint = this.validateEndpoint(options.endpoint ?? DEFAULT_ENDPOINT);
    this.fetchImpl = options.fetchImpl ?? createFetchWithProxy();
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    // userAgent 参数已废弃，现在使用随机 User-Agent 轮换池
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  }

  async searchHtml(request: DuckDuckGoSearchRequest): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeSearch(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === this.maxRetries) {
          break;
        }

        // 判断是否需要重试
        const shouldRetry = this.shouldRetry(lastError);

        if (!shouldRetry) {
          throw lastError;
        }

        // 指数退避延迟：baseDelay * 2^attempt + jitter
        const delayMs = this.calculateBackoff(attempt);
        await this.sleep(delayMs);
      }
    }

    // 所有重试失败，抛出最终错误
    throw new ProviderError('NETWORK_ERROR', `DuckDuckGo request failed after ${this.maxRetries + 1} attempts.`, true, {
      cause: lastError?.message ?? 'Unknown error',
    });
  }

  private async executeSearch(request: DuckDuckGoSearchRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const url = new URL(this.endpoint);

    // DuckDuckGo HTML search requires POST request with form data
    const formData = new URLSearchParams();
    formData.set('q', request.query);

    if (request.country) {
      formData.set('kl', request.country);
    }

    if (request.language) {
      formData.set('kd', request.language);
    }

    try {
      // 生成随机指纹的请求头（反爬对抗）
      const randomHeaders = generateRandomHeaders();
      
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers: randomHeaders,
        body: formData.toString(),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new ProviderError('RATE_LIMITED', 'DuckDuckGo temporarily rate limited the request.', true, {
          status: response.status,
        });
      }

      if (!response.ok) {
        throw new ProviderError('NETWORK_ERROR', 'DuckDuckGo request failed.', true, {
          status: response.status,
        });
      }

      const html = await response.text();

      if (!html.trim()) {
        throw new ProviderError('NETWORK_ERROR', 'DuckDuckGo returned an empty response.', true);
      }

      return html;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      throw new ProviderError('NETWORK_ERROR', 'DuckDuckGo request failed.', true, {
        cause: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private shouldRetry(error: Error): boolean {
    // 如果是 ProviderError，检查是否是可重试的错误
    if (error instanceof ProviderError) {
      return error.retryable ?? true;
    }

    // 网络错误默认重试
    return true;
  }

  private calculateBackoff(attempt: number): number {
    // 指数退避：baseDelay * 2^attempt
    const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt);

    // 添加 jitter（随机抖动 0-1000ms），防止多个请求同时重试
    const jitter = Math.random() * 1000;

    // 限制最大延迟
    return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateEndpoint(endpoint: string): URL {
    const url = new URL(endpoint);

    if (url.protocol !== 'https:') {
      throw new ProviderError('SECURITY_ERROR', 'DuckDuckGo endpoint must use HTTPS.', false);
    }

    if (url.hostname !== 'html.duckduckgo.com') {
      throw new ProviderError('SECURITY_ERROR', 'DuckDuckGo endpoint must target html.duckduckgo.com.', false);
    }

    return url;
  }
}
