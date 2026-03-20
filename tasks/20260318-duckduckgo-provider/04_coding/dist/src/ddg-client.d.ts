import { type DuckDuckGoClientOptions, type DuckDuckGoClient, type DuckDuckGoSearchRequest } from './types.js';
declare global {
    var browserAction: any;
}
export declare class DefaultDuckDuckGoClient implements DuckDuckGoClient {
    private readonly endpoint;
    private readonly fetchImpl;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly baseDelayMs;
    constructor(options?: DuckDuckGoClientOptions);
    searchHtml(request: DuckDuckGoSearchRequest): Promise<string>;
    private executeSearch;
    private shouldRetry;
    private calculateBackoff;
    private sleep;
    /**
     * 人类行为模拟：强制执行真实用户的行为模式
     * - 请求间隔：3 秒 ±30%（人类阅读时间）
     * - 会话限制：每 10 次请求后冷却 60 秒
     * - 失败退避：连续失败后增加延迟
     */
    private enforceHumanBehavior;
    private validateEndpoint;
    /**
     * 使用 browser 工具访问 DuckDuckGo（方案 A）
     * 这是最可靠的方式，使用真实浏览器绕过反爬
     */
    private searchWithBrowser;
    /**
     * 从 browser snapshot 提取 HTML（简化实现）
     */
    private extractHtmlFromSnapshot;
}
