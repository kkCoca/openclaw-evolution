import { ProviderError, type DuckDuckGoClientOptions, type DuckDuckGoClient, type DuckDuckGoSearchRequest } from './types';

const DEFAULT_ENDPOINT = 'https://html.duckduckgo.com/html/';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export class DefaultDuckDuckGoClient implements DuckDuckGoClient {
  private readonly endpoint: URL;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(options: DuckDuckGoClientOptions = {}) {
    this.endpoint = this.validateEndpoint(options.endpoint ?? DEFAULT_ENDPOINT);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  async searchHtml(request: DuckDuckGoSearchRequest): Promise<string> {
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
