import { performance } from 'node:perf_hooks';
import { DEFAULT_DDG_PROVIDER_ENTRY, } from './types.js';
let cachedProviderCtor;
export class DdgAdapter {
    providerFactory;
    now;
    constructor(options = {}) {
        const providerEntry = options.providerEntry ?? DEFAULT_DDG_PROVIDER_ENTRY;
        this.providerFactory =
            options.providerFactory ??
                (async () => {
                    const Provider = await loadProviderCtor(providerEntry);
                    return new Provider();
                });
        this.now = options.now ?? (() => performance.now());
    }
    async search(input) {
        const startedAt = this.now();
        const provider = await this.providerFactory();
        const response = await provider.search(input);
        const items = normalizeItems(response.results ?? []);
        return {
            provider: 'ddg',
            items,
            fallbackUsed: true,
            timingMs: this.now() - startedAt,
            attempts: {
                gemini: 0,
                ddg: 1,
            },
        };
    }
}
async function loadProviderCtor(providerEntry) {
    if (cachedProviderCtor) {
        return cachedProviderCtor;
    }
    const loadedModule = (await import(providerEntry));
    if (!loadedModule.DuckDuckGoSearchProvider) {
        throw new Error(`DuckDuckGoSearchProvider export not found in ${providerEntry}`);
    }
    cachedProviderCtor = loadedModule.DuckDuckGoSearchProvider;
    return cachedProviderCtor;
}
function normalizeItems(results) {
    return results
        .filter((item) => {
        return Boolean(item.title && item.url && item.snippet);
    })
        .map((item) => ({
        title: item.title,
        url: item.url,
        snippet: item.snippet,
    }));
}
