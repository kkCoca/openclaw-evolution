import { describe, expect, it, vi } from 'vitest';

import { SearchCache } from '../src/cache';
import { DuckDuckGoSearchProvider } from '../src/ddg-provider';
import { RateLimitController } from '../src/rate-limiter';
import type { DuckDuckGoClient, DuckDuckGoSearchRequest, DuckDuckGoSearchResponse } from '../src/types';

function buildResponse(query: string): DuckDuckGoSearchResponse {
  return {
    provider: 'duckduckgo',
    query,
    country: null,
    language: null,
    cached: false,
    metadata: {
      country: null,
      language: null,
      requestTimestamp: 1,
    },
    results: [
      {
        title: 'Result',
        snippet: 'Snippet',
        url: 'https://example.com',
        source: 'duckduckgo',
      },
    ],
  };
}

describe('SearchCache', () => {
  it('returns a cloned cached response before expiry', () => {
    const cache = new SearchCache({ ttlMs: 1_000, now: () => 100 });
    const response = buildResponse('OpenClaw');

    cache.set('key', response);

    const cached = cache.get('key');

    expect(cached).toEqual(response);
    expect(cached).not.toBe(response);
  });

  it('evicts expired entries on read', () => {
    let now = 100;
    const cache = new SearchCache({ ttlMs: 50, now: () => now });

    cache.set('key', buildResponse('OpenClaw'));
    now = 151;

    expect(cache.get('key')).toBeNull();
    expect(cache.size()).toBe(0);
  });
});

describe('RateLimitController', () => {
  it('waits for the remaining interval between requests', async () => {
    const delays: number[] = [];
    let now = 0;
    const limiter = new RateLimitController({
      minIntervalMs: 1_000,
      now: () => now,
      sleep: async (ms: number) => {
        delays.push(ms);
        now += ms;
      },
    });

    await limiter.beforeRequest();
    now = 300;
    await limiter.beforeRequest();

    expect(delays).toEqual([700]);
  });

  it('adds adaptive delay after a failure', async () => {
    const delays: number[] = [];
    let now = 0;
    const limiter = new RateLimitController({
      minIntervalMs: 1_000,
      failureBackoffMs: 250,
      maxBackoffMs: 1_000,
      now: () => now,
      sleep: async (ms: number) => {
        delays.push(ms);
        now += ms;
      },
    });

    limiter.afterFailure();
    await limiter.beforeRequest();

    expect(delays).toEqual([250]);
  });
});

describe('DuckDuckGoSearchProvider', () => {
  it('returns cached responses without calling the client', async () => {
    const cache = new SearchCache({ ttlMs: 1_000, now: () => 1 });
    const client: DuckDuckGoClient = {
      searchHtml: vi.fn(async () => '<html></html>'),
    };
    const provider = new DuckDuckGoSearchProvider({
      client,
      cache,
    });
    const request = { query: 'OpenClaw' };

    const first = buildResponse('OpenClaw');
    cache.set(provider.buildCacheKey(provider.normalizeRequest(request)), first);

    const response = await provider.search(request);

    expect(response.cached).toBe(true);
    expect(client.searchHtml).not.toHaveBeenCalled();
  });

  it('normalizes invalid locale values back to null', async () => {
    const requestLog: DuckDuckGoSearchRequest[] = [];
    const client: DuckDuckGoClient = {
      searchHtml: vi.fn(async (request) => {
        requestLog.push(request);
        return `
          <div class="result">
            <h2 class="result__title">
              <a class="result__a" href="https://example.com">Example</a>
            </h2>
            <div class="result__snippet">Snippet</div>
          </div>
        `;
      }),
    };
    const provider = new DuckDuckGoSearchProvider({ client });

    await provider.search({ query: ' OpenClaw ', country: '??', language: 'xx' });

    expect(requestLog[0]).toMatchObject({
      query: 'OpenClaw',
      country: null,
      language: null,
    });
  });

  it('maps parser failures to a retryable false error', async () => {
    const client: DuckDuckGoClient = {
      searchHtml: vi.fn(async () => '<html><body>No results</body></html>'),
    };
    const provider = new DuckDuckGoSearchProvider({ client });

    await expect(provider.search({ query: 'OpenClaw' })).rejects.toMatchObject({
      code: 'PARSE_ERROR',
      retryable: false,
    });
  });
});
