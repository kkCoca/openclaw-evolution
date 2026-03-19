import { performance } from 'node:perf_hooks';

import {
  DEFAULT_DDG_PROVIDER_ENTRY,
  DdgSearchAdapter,
  DdgSearchResponse,
  SearchResultItem,
  SmartSearchInput,
} from './types.js';

interface DdgProviderResult {
  results?: Array<{
    title?: string;
    url?: string;
    snippet?: string;
  }>;
}

interface DdgProviderInstance {
  search(input: SmartSearchInput): Promise<DdgProviderResult>;
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

  async search(input: SmartSearchInput): Promise<DdgSearchResponse> {
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
