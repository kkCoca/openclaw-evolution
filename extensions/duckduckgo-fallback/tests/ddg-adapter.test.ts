import { describe, expect, it } from 'vitest';

import { DdgAdapter } from '../src/ddg-adapter.js';

describe('DdgAdapter', () => {
  it('normalizes provider results into SmartSearchResult', async () => {
    const adapter = new DdgAdapter({
      providerFactory: async () => ({
        async search() {
          return {
            results: [
              {
                title: 'Example',
                url: 'https://example.com',
                snippet: 'Normalized result.',
              },
            ],
          };
        },
      }),
      now: (() => {
        let value = 0;
        return () => {
          value += 5;
          return value;
        };
      })(),
    });

    await expect(adapter.search({ query: 'example query' })).resolves.toMatchObject({
      provider: 'ddg',
      fallbackUsed: true,
      attempts: { gemini: 0, ddg: 1 },
      items: [
        {
          title: 'Example',
          url: 'https://example.com',
          snippet: 'Normalized result.',
        },
      ],
    });
  });
});
