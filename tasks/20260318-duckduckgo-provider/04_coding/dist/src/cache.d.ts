import type { DuckDuckGoSearchResponse, SearchCacheOptions } from './types.js';
export declare class SearchCache {
    private readonly entries;
    private readonly ttlMs;
    private readonly now;
    constructor(options?: SearchCacheOptions);
    get(cacheKey: string): DuckDuckGoSearchResponse | null;
    set(cacheKey: string, response: DuckDuckGoSearchResponse): void;
    delete(cacheKey: string): void;
    size(): number;
    private clone;
}
