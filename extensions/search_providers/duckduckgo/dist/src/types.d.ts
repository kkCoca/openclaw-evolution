export interface WebSearchInput {
    query: string;
    country?: string;
    language?: string;
}
export interface SearchResult {
    title: string;
    snippet: string;
    url: string;
    source: 'duckduckgo';
}
export interface SearchResponseMetadata {
    country: string | null;
    language: string | null;
    requestTimestamp: number;
}
export interface DuckDuckGoSearchResponse {
    provider: 'duckduckgo';
    query: string;
    country: string | null;
    language: string | null;
    cached: boolean;
    metadata: SearchResponseMetadata;
    results: SearchResult[];
}
export interface DuckDuckGoSearchRequest {
    query: string;
    country: string | null;
    language: string | null;
    cacheKey: string;
    requestTimestamp: number;
}
export interface CacheEntry {
    payload: DuckDuckGoSearchResponse;
    createdAt: number;
    expiresAt: number;
}
export interface ProviderErrorShape {
    code: string;
    retryable: boolean;
    details: Record<string, unknown> | undefined;
}
export declare class ProviderError extends Error implements ProviderErrorShape {
    readonly code: string;
    readonly retryable: boolean;
    readonly details: Record<string, unknown> | undefined;
    constructor(code: string, message: string, retryable: boolean, details?: Record<string, unknown>);
}
export interface DuckDuckGoClient {
    searchHtml(request: DuckDuckGoSearchRequest): Promise<string>;
}
export interface DuckDuckGoParser {
    parse(html: string): SearchResult[];
}
export interface SearchCacheLike {
    get(cacheKey: string): DuckDuckGoSearchResponse | null;
    set(cacheKey: string, response: DuckDuckGoSearchResponse): void;
    delete(cacheKey: string): void;
}
export interface RateLimitControllerLike {
    beforeRequest(): Promise<void>;
    afterSuccess(): void;
    afterFailure(): void;
}
export interface DuckDuckGoClientOptions {
    endpoint?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    userAgent?: string;
}
export interface SearchCacheOptions {
    ttlMs?: number;
    now?: () => number;
}
export interface RateLimitControllerOptions {
    minIntervalMs?: number;
    failureBackoffMs?: number;
    maxBackoffMs?: number;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
}
export interface DuckDuckGoSearchProviderOptions {
    client?: DuckDuckGoClient;
    parser?: DuckDuckGoParser;
    cache?: SearchCacheLike;
    rateLimiter?: RateLimitControllerLike;
    now?: () => number;
}
