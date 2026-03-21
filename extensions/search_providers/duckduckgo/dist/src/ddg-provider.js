import { SearchCache } from './cache.js';
import { DefaultDuckDuckGoClient } from './ddg-client.js';
import { DuckDuckGoHtmlParser } from './parser.js';
import { RateLimitController } from './rate-limiter.js';
import { ProviderError, } from './types.js';
const COUNTRY_MAP = {
    cn: 'cn-zh',
    us: 'us-en',
    gb: 'uk-en',
    uk: 'uk-en',
    de: 'de-de',
    fr: 'fr-fr',
    jp: 'jp-jp',
};
const LANGUAGE_MAP = {
    en: 'en-us',
    'en-us': 'en-us',
    zh: 'zh-cn',
    'zh-cn': 'zh-cn',
    'zh-tw': 'zh-tw',
    de: 'de-de',
    fr: 'fr-fr',
    ja: 'ja-jp',
};
export class DuckDuckGoSearchProvider {
    client;
    parser;
    cache;
    rateLimiter;
    now;
    constructor(options = {}) {
        this.client = options.client ?? new DefaultDuckDuckGoClient();
        this.parser = options.parser ?? new DuckDuckGoHtmlParser();
        this.cache = options.cache ?? new SearchCache();
        this.rateLimiter = options.rateLimiter ?? new RateLimitController();
        this.now = options.now ?? Date.now;
    }
    normalizeRequest(input) {
        const query = input.query.trim();
        if (!query) {
            throw new ProviderError('INPUT_ERROR', 'Query is required.', false);
        }
        if (query.length > 500) {
            throw new ProviderError('INPUT_ERROR', 'Query must be 500 characters or fewer.', false);
        }
        const normalizedRequest = {
            query,
            country: normalizeLocale(input.country, COUNTRY_MAP),
            language: normalizeLocale(input.language, LANGUAGE_MAP),
            requestTimestamp: this.now(),
            cacheKey: '',
        };
        return {
            ...normalizedRequest,
            cacheKey: this.buildCacheKey(normalizedRequest),
        };
    }
    buildCacheKey(request) {
        return JSON.stringify([request.query.toLowerCase(), request.country, request.language]);
    }
    async search(input) {
        const request = this.normalizeRequest(input);
        const cached = this.cache.get(request.cacheKey);
        if (cached) {
            return {
                ...cached,
                cached: true,
            };
        }
        try {
            await this.rateLimiter.beforeRequest();
            const html = await this.client.searchHtml(request);
            const results = this.parser.parse(html);
            const response = {
                provider: 'duckduckgo',
                query: request.query,
                country: request.country,
                language: request.language,
                cached: false,
                metadata: {
                    country: request.country,
                    language: request.language,
                    requestTimestamp: request.requestTimestamp,
                },
                results,
            };
            this.cache.set(request.cacheKey, response);
            this.rateLimiter.afterSuccess();
            return response;
        }
        catch (error) {
            this.rateLimiter.afterFailure();
            throw this.toProviderError(error);
        }
    }
    toProviderError(error) {
        if (error instanceof ProviderError) {
            return error;
        }
        return new ProviderError('NETWORK_ERROR', 'DuckDuckGo search failed.', true, {
            cause: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
function normalizeLocale(value, mapping) {
    if (!value) {
        return null;
    }
    const normalizedValue = value.trim().toLowerCase();
    return mapping[normalizedValue] ?? null;
}
