import { type DuckDuckGoClientOptions, type DuckDuckGoClient, type DuckDuckGoSearchRequest } from './types.js';
export declare class DefaultDuckDuckGoClient implements DuckDuckGoClient {
    private readonly endpoint;
    private readonly timeoutMs;
    private readonly userAgent;
    private readonly proxyMode;
    private readonly dispatcher?;
    constructor(options?: DuckDuckGoClientOptions);
    searchHtml(request: DuckDuckGoSearchRequest): Promise<string>;
    private validateEndpoint;
}
