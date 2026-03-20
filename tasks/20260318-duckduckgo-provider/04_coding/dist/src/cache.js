const DEFAULT_TTL_MS = 15 * 60 * 1000;
export class SearchCache {
    entries = new Map();
    ttlMs;
    now;
    constructor(options = {}) {
        this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
        this.now = options.now ?? Date.now;
    }
    get(cacheKey) {
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
    set(cacheKey, response) {
        const createdAt = this.now();
        this.entries.set(cacheKey, {
            payload: this.clone(response),
            createdAt,
            expiresAt: createdAt + this.ttlMs,
        });
    }
    delete(cacheKey) {
        this.entries.delete(cacheKey);
    }
    size() {
        return this.entries.size;
    }
    clone(response) {
        return structuredClone(response);
    }
}
