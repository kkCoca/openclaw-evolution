import type { CacheEntry, DuckDuckGoSearchResponse, SearchCacheOptions } from './types';

const DEFAULT_TTL_MS = 15 * 60 * 1000;

export class SearchCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options: SearchCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.now = options.now ?? Date.now;
  }

  get(cacheKey: string): DuckDuckGoSearchResponse | null {
    const entry = this.entries.get(cacheKey);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= this.now()) {
      this.entries.delete(cacheKey);
      return null;
    }

    return this.clone(entry.payload);
  }

  set(cacheKey: string, response: DuckDuckGoSearchResponse): void {
    const createdAt = this.now();

    this.entries.set(cacheKey, {
      payload: this.clone(response),
      createdAt,
      expiresAt: createdAt + this.ttlMs,
    });
  }

  delete(cacheKey: string): void {
    this.entries.delete(cacheKey);
  }

  size(): number {
    return this.entries.size;
  }

  private clone(response: DuckDuckGoSearchResponse): DuckDuckGoSearchResponse {
    return structuredClone(response);
  }
}
