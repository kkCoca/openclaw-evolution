import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSmartSearchRuntime } from '../src/index.js';
import { getGeminiHealthStatus, resetGeminiHealthStatus } from '../src/fallback-manager.js';
import { DEFAULT_FALLBACK_CONFIG, GeminiSearchProvider, SmartSearchError, StructuredLogFields } from '../src/types.js';

interface LoggedEvent {
  event: string;
  fields: StructuredLogFields;
}

function createLogger(events: LoggedEvent[]) {
  return {
    info(event: string, fields: StructuredLogFields) {
      events.push({ event, fields });
    },
    warn(event: string, fields: StructuredLogFields) {
      events.push({ event, fields });
    },
    error(event: string, fields: StructuredLogFields) {
      events.push({ event, fields });
    },
  };
}

describe('smartSearch fallback flow', () => {
  beforeEach(() => {
    resetGeminiHealthStatus();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Gemini results when Gemini succeeds', async () => {
    const events: LoggedEvent[] = [];
    const geminiProvider: GeminiSearchProvider = {
      async search() {
        return {
          items: [{ title: 'Gemini', url: 'https://gemini.example', snippet: 'Primary result' }],
        };
      },
    };

    const runtime = createSmartSearchRuntime({
      geminiProvider,
      ddgAdapter: {
        async search() {
          throw new Error('should not call ddg');
        },
      },
      logger: createLogger(events),
    });

    const result = await runtime.smartSearch({ query: 'hello world' });

    expect(result).toMatchObject({
      provider: 'gemini',
      fallbackUsed: false,
      attempts: { gemini: 1, ddg: 0 },
    });
    expect(events.some((event) => event.event === 'search.gemini.succeeded')).toBe(true);
  });

  it('falls back to DDG on 429 and records structured fields', async () => {
    const events: LoggedEvent[] = [];
    const runtime = createSmartSearchRuntime({
      geminiProvider: {
        async search() {
          throw Object.assign(new Error('Too Many Requests'), { status: 429 });
        },
      },
      ddgAdapter: {
        async search() {
          return {
            provider: 'ddg',
            items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Fallback result' }],
            fallbackUsed: true,
            timingMs: 10,
            attempts: { gemini: 0, ddg: 1 },
          };
        },
      },
      logger: createLogger(events),
    });

    const result = await runtime.smartSearch({ query: 'fallback me', requestId: 'req-1' });

    expect(result).toMatchObject({
      provider: 'ddg',
      fallbackUsed: true,
      attempts: { gemini: 1, ddg: 1 },
    });

    const fallbackEvent = events.find((event) => event.event === 'search.fallback.triggered');
    expect(fallbackEvent?.fields).toMatchObject({
      requestId: 'req-1',
      reasonCode: 'gemini_rate_limited',
      fallbackUsed: true,
      geminiAttempted: true,
      ddgAttempted: false,
    });
    expect(typeof fallbackEvent?.fields.queryHash).toBe('string');
  });

  it('decides fallback within five seconds when Gemini hangs', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-19T00:00:00.000Z'));
    const events: LoggedEvent[] = [];
    const geminiProvider: GeminiSearchProvider = {
      async search(_input, options) {
        return await new Promise((resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted by timeout'));
          });
          void resolve;
        });
      },
    };

    const runtime = createSmartSearchRuntime({
      geminiProvider,
      ddgAdapter: {
        async search() {
          return {
            provider: 'ddg',
            items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Timeout fallback' }],
            fallbackUsed: true,
            timingMs: 20,
            attempts: { gemini: 0, ddg: 1 },
          };
        },
      },
      logger: createLogger(events),
      now: Date.now,
    });

    const pending = runtime.smartSearch({ query: 'slow query' });
    await vi.advanceTimersByTimeAsync(4500);
    const result = await pending;

    expect(result.provider).toBe('ddg');
    const fallbackEvent = events.find((event) => event.event === 'search.fallback.triggered');
    expect(fallbackEvent?.fields.reasonCode).toBe('gemini_timeout');
    expect(fallbackEvent?.fields.elapsedMs).toBeLessThanOrEqual(4500);
  });

  it('throws fatal auth errors without fallback', async () => {
    const runtime = createSmartSearchRuntime({
      geminiProvider: {
        async search() {
          throw Object.assign(new Error('Unauthorized'), { status: 401 });
        },
      },
      ddgAdapter: {
        async search() {
          throw new Error('should not fallback');
        },
      },
    });

    await expect(runtime.smartSearch({ query: 'secret' })).rejects.toMatchObject({
      details: {
        reasonCode: 'gemini_auth_error',
        fallbackTried: false,
      },
    });
  });

  it('retries DDG and eventually succeeds', async () => {
    const events: LoggedEvent[] = [];
    let ddgCalls = 0;
    const runtime = createSmartSearchRuntime({
      geminiProvider: {
        async search() {
          throw Object.assign(new Error('Service Unavailable'), { status: 503 });
        },
      },
      ddgAdapter: {
        async search() {
          ddgCalls += 1;
          if (ddgCalls < 2) {
            throw new Error('temporary ddg issue');
          }

          return {
            provider: 'ddg',
            items: [{ title: 'Recovered', url: 'https://ddg.example', snippet: 'Recovered result' }],
            fallbackUsed: true,
            timingMs: 5,
            attempts: { gemini: 0, ddg: 1 },
          };
        },
      },
      logger: createLogger(events),
    });

    const result = await runtime.smartSearch({ query: 'retry please' });

    expect(result.attempts.ddg).toBe(2);
    expect(events.some((event) => event.event === 'search.ddg.retry')).toBe(true);
  });

  it('throws a final error after DDG exhausts retries', async () => {
    const runtime = createSmartSearchRuntime({
      geminiProvider: {
        async search() {
          throw Object.assign(new Error('Service Unavailable'), { status: 503 });
        },
      },
      ddgAdapter: {
        async search() {
          throw new Error('ddg failed');
        },
      },
    });

    await expect(runtime.smartSearch({ query: 'fail all' })).rejects.toBeInstanceOf(SmartSearchError);
    await expect(runtime.smartSearch({ query: 'fail all' })).rejects.toMatchObject({
      details: {
        primaryReasonCode: 'gemini_service_unavailable',
        fallbackTried: true,
        ddgAttempts: DEFAULT_FALLBACK_CONFIG.maxDdgRetries,
        finalProvider: 'ddg',
      },
    });
  });

  it('shares Gemini health across requests and recovers after cooldown', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-19T00:00:00.000Z'));
    let geminiCalls = 0;

    const ddgAdapter = {
      async search() {
        return {
          provider: 'ddg' as const,
          items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Fallback result' }],
          fallbackUsed: true,
          timingMs: 1,
          attempts: { gemini: 0, ddg: 1 },
        };
      },
    };

    const runtime = createSmartSearchRuntime({
      geminiProvider: {
        async search() {
          geminiCalls += 1;
          if (geminiCalls <= 3) {
            throw Object.assign(new Error('Service Unavailable'), { status: 503 });
          }
          return {
            items: [{ title: 'Gemini', url: 'https://gemini.example', snippet: 'Recovered' }],
          };
        },
      },
      ddgAdapter,
      now: Date.now,
    });

    await runtime.smartSearch({ query: '1' });
    await runtime.smartSearch({ query: '2' });
    await runtime.smartSearch({ query: '3' });

    expect(getGeminiHealthStatus().status).toBe('unhealthy');

    await runtime.smartSearch({ query: '4' });
    expect(geminiCalls).toBe(3);

    await vi.advanceTimersByTimeAsync(DEFAULT_FALLBACK_CONFIG.healthCheck.circuitBreakerTimeoutMs);

    await runtime.smartSearch({ query: '5' });
    expect(getGeminiHealthStatus().status).toBe('degraded');

    await runtime.smartSearch({ query: '6' });
    expect(getGeminiHealthStatus().status).toBe('healthy');
  });
});
