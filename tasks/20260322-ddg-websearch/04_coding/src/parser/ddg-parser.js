const { SearchError } = require('../error/search-error.js');

function cleanText(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(url) {
  if (!url) {
    return '';
  }

  try {
    if (url.startsWith('/l/?')) {
      const parsed = new URL(`https://duckduckgo.com${url}`);
      const redirected = parsed.searchParams.get('uddg');
      return redirected || url;
    }

    return new URL(url, 'https://duckduckgo.com').toString();
  } catch (_) {
    return '';
  }
}

function detectDdgBlockingState(html) {
  const lower = html.toLowerCase();
  if (lower.includes('captcha') || lower.includes('challenge-form')) {
    return { blocked: true, type: 'captcha_detected', message: 'DuckDuckGo returned a captcha challenge' };
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return { blocked: true, type: 'rate_limit', message: 'DuckDuckGo rate limited the request' };
  }

  return { blocked: false };
}

function extractDdgResults(html, limit) {
  const blocks = [...html.matchAll(/<article[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/article>/g)];

  return blocks.slice(0, limit).map((match) => {
    const block = match[1];
    const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
      || block.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    if (!titleMatch) {
      return null;
    }

    const url = normalizeUrl(titleMatch[1]);
    if (!url) {
      return null;
    }

    return {
      title: cleanText(titleMatch[2]),
      url,
      snippet: snippetMatch ? cleanText(snippetMatch[1]) : '',
      source: 'ddg',
    };
  }).filter(Boolean);
}

function extractDdgRelatedSearches(html) {
  const sectionMatch = html.match(/<div[^>]*class="[^"]*related-searches[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (!sectionMatch) {
    return [];
  }

  return [...sectionMatch[1].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/g)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
}

function parseDdgDocument(html, limit) {
  const blockingState = detectDdgBlockingState(html);
  if (blockingState.blocked) {
    throw new SearchError(blockingState.type, blockingState.message, true, 'ddg');
  }

  const results = extractDdgResults(html, limit);
  const relatedSearches = extractDdgRelatedSearches(html);
  const looksEmpty = /no results|results--empty/i.test(html);

  if (results.length === 0 && !looksEmpty) {
    throw new SearchError('parse_error', 'DuckDuckGo document did not match expected structure', true, 'ddg');
  }

  return {
    results,
    relatedSearches,
  };
}

module.exports = {
  detectDdgBlockingState,
  extractDdgRelatedSearches,
  extractDdgResults,
  parseDdgDocument,
};
