/**
 * TD-001: DuckDuckGo 搜索之盾 - DDG 适配器
 * 
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-duckduckgo-fallback/03_detailing/SPEC.md
 */

import { performance } from 'node:perf_hooks';

import {
  DEFAULT_DDG_PROVIDER_ENTRY,
  DdgSearchAdapter,
  DdgSearchResponse,
  SearchRequest,
  SearchResultItem,
} from './types.js';

interface DdgProviderResult {
  results?: Array<{
    title?: string;
    url?: string;
    snippet?: string;
  }>;
}

interface DdgProviderInstance {
  search(input: SearchRequest): Promise<DdgProviderResult>;
}

type ProviderCtor = new () => DdgProviderInstance;

let cachedProviderCtor: ProviderCtor | undefined;

export interface DdgAdapterOptions {
  providerEntry?: string;
  providerFactory?: () => Promise<DdgProviderInstance>;
  now?: () => number;
}

export class DdgAdapter implements DdgSearchAdapter {
  private readonly providerFactory: () => Promise<DdgProviderInstance>;
  private readonly now: () => number;

  constructor(options: DdgAdapterOptions = {}) {
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
  async search(input: SearchRequest): Promise<DdgSearchResponse> {
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

async function loadProviderCtor(providerEntry: string): Promise<ProviderCtor> {
  if (cachedProviderCtor) {
    return cachedProviderCtor;
  }

  const loadedModule = (await import(providerEntry)) as {
    DuckDuckGoSearchProvider?: ProviderCtor;
  };

  if (!loadedModule.DuckDuckGoSearchProvider) {
    throw new Error(`DuckDuckGoSearchProvider export not found in ${providerEntry}`);
  }

  cachedProviderCtor = loadedModule.DuckDuckGoSearchProvider;
  return cachedProviderCtor;
}

function normalizeItems(results: NonNullable<DdgProviderResult['results']>): SearchResultItem[] {
  return results
    .filter((item): item is Required<SearchResultItem> => {
      return Boolean(item.title && item.url && item.snippet);
    })
    .map((item) => ({
      title: item.title,
      url: item.url,
      snippet: item.snippet,
    }));
}
