import { ProviderError, type DuckDuckGoClientOptions, type DuckDuckGoClient, type DuckDuckGoSearchRequest } from './types';

const DEFAULT_ENDPOINT = 'https://html.duckduckgo.com/html/';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000; // 1 秒基础延迟
const MAX_DELAY_MS = 30_000; // 最大延迟 30 秒

export class DefaultDuckDuckGoClient implements DuckDuckGoClient {
  private readonly endpoint: URL;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;

  constructor(options: DuckDuckGoClientOptions = {}) {
    this.endpoint = this.validateEndpoint(options.endpoint ?? DEFAULT_ENDPOINT);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
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

    url.searchParams.set('q', request.query);

    if (request.country) {
      url.searchParams.set('kl', request.country);
    }

    if (request.language) {
      url.searchParams.set('kd', request.language);
    }

    try {
      const response = await this.fetchImpl(url, {
        method: 'GET',
        headers: {
          'user-agent': this.userAgent,
          'accept': 'text/html,application/xhtml+xml',
        },
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
