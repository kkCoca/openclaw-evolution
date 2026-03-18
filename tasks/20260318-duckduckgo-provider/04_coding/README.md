# DuckDuckGo Provider

This package implements a DuckDuckGo-backed `web_search` provider for OpenClaw.

## Features

- Strict TypeScript implementation for Node.js 18+
- DuckDuckGo HTML search client with HTTPS-only endpoint validation
- HTML parser that extracts `title`, `snippet`, and `url`
- In-memory cache with a default 15 minute TTL
- Adaptive rate limiter with a default 1 second request interval
- Unit tests for parsing, caching, rate limiting, and provider orchestration

## Install

```bash
npm install
```

## Scripts

```bash
npm test
npm run build
```

## Usage

```ts
import { DuckDuckGoSearchProvider } from './src/index';

const provider = new DuckDuckGoSearchProvider();
const response = await provider.search({
  query: 'OpenClaw gateway',
  country: 'CN',
  language: 'zh-CN',
});

console.log(response.results);
```

## Notes

- `country` and `language` fall back to `null` when the value is unsupported.
- Only `http` and `https` result URLs are returned.
- The implementation returns at most 10 results from the first DuckDuckGo page.
- Empty or malformed HTML responses surface as provider errors.
