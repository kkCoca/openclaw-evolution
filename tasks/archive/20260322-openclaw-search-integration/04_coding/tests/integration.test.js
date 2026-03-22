const test = require('node:test');
const assert = require('node:assert/strict');

const {
  GeminiAdapter,
  DDGAdapter,
  SearchProvider,
} = require('../src/search-provider.js');

function createJsonResponse(status, jsonBody) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return jsonBody;
    },
  };
}

test('creates provider with Gemini and DDG adapters', () => {
  const provider = new SearchProvider({ fetchFn: async () => createJsonResponse(200, {}) });

  assert.ok(provider.gemini instanceof GeminiAdapter);
  assert.ok(provider.ddg instanceof DDGAdapter);
  assert.equal(typeof provider.search, 'function');
});

test('returns Gemini result when primary search succeeds', async () => {
  const calls = [];
  const fetchFn = async (url) => {
    calls.push(url);
    return createJsonResponse(200, {
      candidates: [
        {
          content: {
            parts: [{ text: 'Gemini answer' }],
          },
        },
      ],
    });
  };

  const provider = new SearchProvider({ geminiApiKey: 'key', fetchFn });
  const result = await provider.search('openclaw');

  assert.equal(result.source, 'gemini');
  assert.equal(result.query, 'openclaw');
  assert.deepEqual(result.results, ['Gemini answer']);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /generativelanguage.googleapis.com/);
});

test('falls back to DDG when Gemini returns a retryable error', async () => {
  const calls = [];
  const fetchFn = async (url) => {
    calls.push(url);
    if (url.includes('generativelanguage.googleapis.com')) {
      return createJsonResponse(503, { error: { message: 'busy' } });
    }

    return createJsonResponse(200, {
      AbstractText: 'DuckDuckGo result',
      RelatedTopics: [],
    });
  };

  const provider = new SearchProvider({ geminiApiKey: 'key', fetchFn });
  const result = await provider.search('fallback case');

  assert.equal(result.source, 'duckduckgo');
  assert.equal(result.query, 'fallback case');
  assert.deepEqual(result.results, ['DuckDuckGo result']);
  assert.equal(calls.length, 2);
});

test('rethrows non-retryable Gemini errors without fallback', async () => {
  let ddgCalled = false;
  const fetchFn = async (url) => {
    if (url.includes('generativelanguage.googleapis.com')) {
      return createJsonResponse(400, { error: { message: 'invalid query' } });
    }

    ddgCalled = true;
    return createJsonResponse(200, {});
  };

  const provider = new SearchProvider({ geminiApiKey: 'key', fetchFn });

  await assert.rejects(
    () => provider.search('bad request'),
    (error) => {
      assert.match(error.message, /Gemini API error: 400/);
      return true;
    },
  );

  assert.equal(ddgCalled, false);
});
