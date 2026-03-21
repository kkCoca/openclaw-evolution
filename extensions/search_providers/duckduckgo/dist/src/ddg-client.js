import { ProviderError } from './types.js';
import { request as undiciRequest, ProxyAgent } from 'undici';
const DEFAULT_ENDPOINT = 'https://html.duckduckgo.com/html/';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const PROXY_MODE = (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) ? 'system' : 'none';
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
export class DefaultDuckDuckGoClient {
    endpoint;
    timeoutMs;
    userAgent;
    proxyMode;
    dispatcher;
    constructor(options = {}) {
        this.endpoint = this.validateEndpoint(options.endpoint ?? DEFAULT_ENDPOINT);
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
        this.proxyMode = PROXY_MODE;
        // 如果配置了系统代理，使用 ProxyAgent
        if (this.proxyMode === 'system' && PROXY_URL) {
            this.dispatcher = new ProxyAgent(PROXY_URL);
        }
        // 否则不使用 dispatcher（直接连接）
    }
    async searchHtml(request) {
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
            // 构建请求选项
            const requestOptions = {
                method: 'GET',
                headers: {
                    'user-agent': this.userAgent,
                    'accept': 'text/html,application/xhtml+xml',
                },
                signal: controller.signal,
            };
            // 如果配置了代理，添加 dispatcher
            if (this.dispatcher) {
                requestOptions.dispatcher = this.dispatcher;
            }
            const response = await undiciRequest(url, requestOptions);
            if (response.statusCode === 429) {
                throw new ProviderError('RATE_LIMITED', 'DuckDuckGo temporarily rate limited the request.', true, {
                    status: response.statusCode,
                });
            }
            if (response.statusCode !== 200) {
                throw new ProviderError('NETWORK_ERROR', 'DuckDuckGo request failed.', true, {
                    status: response.statusCode,
                });
            }
            const chunks = [];
            for await (const chunk of response.body) {
                chunks.push(chunk);
            }
            const html = Buffer.concat(chunks).toString();
            if (!html.trim()) {
                throw new ProviderError('NETWORK_ERROR', 'DuckDuckGo returned an empty response.', true);
            }
            return html;
        }
        catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }
            throw new ProviderError('NETWORK_ERROR', 'DuckDuckGo request failed.', true, {
                cause: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        finally {
            clearTimeout(timeout);
        }
    }
    validateEndpoint(endpoint) {
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
