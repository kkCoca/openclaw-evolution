# DDG Fallback Skill

Gemini is the primary search provider and DuckDuckGo is the fallback provider. This package implements the `smartSearch()` runtime required by `03_technical/SPEC.md` with a direct-import DDG bridge, structured logging, and cross-request Gemini circuit-breaker state.

## Files

- `src/types.ts`: shared contracts, defaults, and error types.
- `src/error-classifier.ts`: Gemini error normalization and fallback classification.
- `src/ddg-adapter.ts`: dynamic import wrapper for the DDG provider bridge.
- `src/fallback-manager.ts`: request state machine, timeout policy, DDG retry loop, and Gemini health state.
- `src/index.ts`: runtime assembly and public `smartSearch()` export.
- `tests/*.test.ts`: classifier, adapter, fallback, retry, timeout, and health-state coverage.

## Usage

```ts
import { createSmartSearchRuntime } from './src/index.js';

const runtime = createSmartSearchRuntime({
  geminiProvider: {
    async search(input, options) {
      return {
        items: [
          {
            title: `Gemini result for ${input.query}`,
            url: 'https://example.com',
            snippet: 'Example snippet',
          },
        ],
      };
    },
  },
});

const result = await runtime.smartSearch({ query: 'openclaw fallback' });
```

## Logging

The default logger writes JSON lines to `console`. Each event includes `requestId`, `queryHash`, `reasonCode`, `occurredAt`, `elapsedMs`, `retryCount`, `finalProvider`, `fallbackUsed`, `geminiAttempted`, `ddgAttempted`, and `errorMessage` when available.

## Test

```bash
npm test
```
