import { ProviderError } from './types.js';
import { ProxyAgent } from 'undici';
// 使用主站而非 HTML 接口（主站反爬更宽松）
const DEFAULT_ENDPOINT = 'https://duckduckgo.com/html/';
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 3000; // 3 秒基础延迟（模拟人类阅读时间）
const MAX_DELAY_MS = 60_000; // 最大延迟 60 秒
const SESSION_STATE = {
    requestCount: 0,
    lastRequestTime: 0,
    consecutiveFailures: 0,
};
const MAX_REQUESTS_PER_SESSION = 10; // 每 10 次请求后重置会话
const COOLDOWN_AFTER_MAX_REQUESTS = 60_000; // 冷却 60 秒
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
function randomChoice(array) {
    if (array.length === 0) {
        throw new Error('Cannot choose from empty array');
    }
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}
/**
 * 生成随机指纹的请求头
 */
function generateRandomHeaders() {
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
function getSystemProxy() {
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
    return httpsProxy || httpProxy;
}
// 创建带代理的 fetch 实现
function createFetchWithProxy() {
    const proxyUrl = getSystemProxy();
    if (proxyUrl) {
        const dispatcher = new ProxyAgent(proxyUrl);
        // 使用 undici 的 fetch 实现，支持代理
        return (input, init) => {
            return fetch(input, { ...init, dispatcher });
        };
    }
    return fetch;
}
export class DefaultDuckDuckGoClient {
    endpoint;
    fetchImpl;
    timeoutMs;
    maxRetries;
    baseDelayMs;
    constructor(options = {}) {
        this.endpoint = this.validateEndpoint(options.endpoint ?? DEFAULT_ENDPOINT);
        this.fetchImpl = options.fetchImpl ?? createFetchWithProxy();
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        // userAgent 参数已废弃，现在使用随机 User-Agent 轮换池
        this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
        this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    }
    async searchHtml(request) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.executeSearch(request);
            }
            catch (error) {
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
    async executeSearch(request) {
        // ============ 人类行为模拟：请求前检查 ============
        await this.enforceHumanBehavior();
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
            // 添加 Cookie（会话管理）
            if (SESSION_STATE.cookie) {
                randomHeaders['cookie'] = SESSION_STATE.cookie;
            }
            const response = await this.fetchImpl(url, {
                method: 'POST',
                headers: randomHeaders,
                body: formData.toString(),
                signal: controller.signal,
            });
            // 保存 Cookie（会话管理）
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                const cookieValue = setCookie.split(';')[0];
                if (cookieValue) {
                    SESSION_STATE.cookie = cookieValue;
                }
            }
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
    shouldRetry(error) {
        // 如果是 ProviderError，检查是否是可重试的错误
        if (error instanceof ProviderError) {
            return error.retryable ?? true;
        }
        // 网络错误默认重试
        return true;
    }
    calculateBackoff(attempt) {
        // 指数退避：baseDelay * 2^attempt
        const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt);
        // 添加 jitter（随机抖动 0-1000ms），防止多个请求同时重试
        const jitter = Math.random() * 1000;
        // 限制最大延迟
        return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 人类行为模拟：强制执行真实用户的行为模式
     * - 请求间隔：3 秒 ±30%（人类阅读时间）
     * - 会话限制：每 10 次请求后冷却 60 秒
     * - 失败退避：连续失败后增加延迟
     */
    async enforceHumanBehavior() {
        const now = Date.now();
        // 检查是否需要会话冷却
        if (SESSION_STATE.requestCount >= MAX_REQUESTS_PER_SESSION) {
            const timeSinceLastRequest = now - SESSION_STATE.lastRequestTime;
            if (timeSinceLastRequest < COOLDOWN_AFTER_MAX_REQUESTS) {
                const remainingCooldown = COOLDOWN_AFTER_MAX_REQUESTS - timeSinceLastRequest;
                console.log(`[DDG] 会话冷却：等待 ${Math.round(remainingCooldown / 1000)} 秒`);
                await this.sleep(remainingCooldown);
                // 重置会话
                SESSION_STATE.requestCount = 0;
                delete SESSION_STATE.cookie;
            }
        }
        // 基础延迟：3 秒 ±30%（模拟人类阅读时间）
        const baseDelay = this.baseDelayMs;
        const jitter = baseDelay * 0.3 * (Math.random() * 2 - 1); // ±30%
        const humanDelay = baseDelay + jitter;
        // 检查上次请求时间
        const timeSinceLastRequest = now - SESSION_STATE.lastRequestTime;
        if (timeSinceLastRequest < humanDelay) {
            const remainingDelay = humanDelay - timeSinceLastRequest;
            await this.sleep(remainingDelay);
        }
        // 更新会话状态
        SESSION_STATE.requestCount++;
        SESSION_STATE.lastRequestTime = Date.now();
    }
    validateEndpoint(endpoint) {
        const url = new URL(endpoint);
        if (url.protocol !== 'https:') {
            throw new ProviderError('SECURITY_ERROR', 'DuckDuckGo endpoint must use HTTPS.', false);
        }
        // 允许使用主站或 HTML 接口（主站反爬更宽松）
        if (url.hostname !== 'html.duckduckgo.com' && url.hostname !== 'duckduckgo.com') {
            throw new ProviderError('SECURITY_ERROR', 'DuckDuckGo endpoint must target duckduckgo.com or html.duckduckgo.com.', false);
        }
        return url;
    }
    /**
     * 使用 browser 工具访问 DuckDuckGo（方案 A）
     * 这是最可靠的方式，使用真实浏览器绕过反爬
     */
    async searchWithBrowser(query) {
        try {
            const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            // 使用 OpenClaw browser 工具打开页面
            const browserResult = await browserAction({
                action: 'open',
                targetUrl: url,
            });
            // 等待页面加载
            await this.sleep(3000);
            // 获取页面 HTML
            const snapshot = await browserAction({
                action: 'snapshot',
                targetId: browserResult.targetId,
            });
            // 从 snapshot 提取 HTML（简化实现）
            const html = this.extractHtmlFromSnapshot(snapshot);
            // 关闭标签页
            await browserAction({
                action: 'close',
                targetId: browserResult.targetId,
            }).catch(() => { });
            if (!html || html.length < 100) {
                throw new ProviderError('NETWORK_ERROR', 'Browser failed to load DuckDuckGo page.', true);
            }
            return html;
        }
        catch (error) {
            throw new ProviderError('NETWORK_ERROR', `Browser search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
    }
    /**
     * 从 browser snapshot 提取 HTML（简化实现）
     */
    extractHtmlFromSnapshot(snapshot) {
        // 这是一个简化实现
        // 实际需要根据 snapshot 格式解析 HTML
        return snapshot?.html || '';
    }
}
