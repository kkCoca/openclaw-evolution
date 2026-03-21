/**
 * TD-001: DuckDuckGo 搜索之盾 - DDG 适配器
 *
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-duckduckgo-fallback/03_detailing/SPEC.md
 */
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
    /**
     * 执行 DuckDuckGo 搜索
     *
     * TD-001: 符合 SPEC 3.2 SearchResponse 接口
     */
    async search(input) {
        const startedAt = this.now();
        const provider = await this.providerFactory();
        const response = await provider.search(input);
        const items = normalizeItems(response.results ?? []);
        return {
            provider: 'ddg',
            items,
            tookMs: this.now() - startedAt,
            cached: false,
            fallbackUsed: true,
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
