/**
 * TD-001: DuckDuckGo 搜索之盾 - DDG 适配器测试
 * 
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 */

import { describe, expect, it, vi } from 'vitest';

import { DdgAdapter } from '../src/ddg-adapter.js';

describe('DdgAdapter (TD-001)', () => {
  it('searches DuckDuckGo and returns normalized results', async () => {
    const mockProvider = {
      async search() {
        return {
          results: [
            { title: 'Test 1', url: 'https://test1.example', snippet: 'Snippet 1' },
            { title: 'Test 2', url: 'https://test2.example', snippet: 'Snippet 2' },
          ],
        };
      },
    };

    const adapter = new DdgAdapter({
      providerFactory: async () => mockProvider,
    });

    const result = await adapter.search({ query: 'test query' });

    expect(result).toMatchObject({
      provider: 'ddg',
      items: [
        { title: 'Test 1', url: 'https://test1.example', snippet: 'Snippet 1' },
        { title: 'Test 2', url: 'https://test2.example', snippet: 'Snippet 2' },
      ],
      tookMs: expect.any(Number),
      cached: false,
      fallbackUsed: true,
      attempts: { gemini: 0, ddg: 1 },
    });
  });

  it('filters out incomplete results', async () => {
    const mockProvider = {
      async search() {
        return {
          results: [
            { title: 'Complete', url: 'https://complete.example', snippet: 'Complete snippet' },
            { title: 'Missing URL', url: undefined as any, snippet: 'Should be filtered' },
            { title: undefined as any, url: 'https://missing-title.example', snippet: 'Should be filtered' },
          ],
        };
      },
    };

    const adapter = new DdgAdapter({
      providerFactory: async () => mockProvider,
    });

    const result = await adapter.search({ query: 'test' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Complete');
  });

  it('handles empty results', async () => {
    const mockProvider = {
      async search() {
        return { results: [] };
      },
    };

    const adapter = new DdgAdapter({
      providerFactory: async () => mockProvider,
    });

    const result = await adapter.search({ query: 'empty' });

    expect(result.items).toHaveLength(0);
    expect(result.provider).toBe('ddg');
  });
});
