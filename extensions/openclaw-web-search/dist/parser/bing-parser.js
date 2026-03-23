const { SearchError } = require('../error/search-error.js');

function cleanText(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectBingBlockingState(html) {
  const lower = html.toLowerCase();
  if (lower.includes('captcha') || lower.includes('unusual traffic')) {
    return { blocked: true, type: 'captcha_detected', message: 'Bing returned a challenge page' };
  }
  if (lower.includes('too many requests')) {
    return { blocked: true, type: 'rate_limit', message: 'Bing rate limited the request' };
  }

  return { blocked: false };
}

function extractBingResults(html, limit) {
  const blocks = [...html.matchAll(/<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>([\s\S]*?)<\/li>/g)];

  return blocks.slice(0, limit).map((match) => {
    const block = match[1];
    // 优化正则支持灵活 class（v1.1 修复）
    const titleMatch = block.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

    if (!titleMatch) {
      return null;
    }

    return {
      title: cleanText(titleMatch[2]),
      url: titleMatch[1],
      snippet: snippetMatch ? cleanText(snippetMatch[1]) : '',
      source: 'bing',
    };
  }).filter(Boolean);
}

function parseBingDocument(html, limit) {
  const blockingState = detectBingBlockingState(html);
  if (blockingState.blocked) {
    throw new SearchError(blockingState.type, blockingState.message, true, 'bing');
  }

  const results = extractBingResults(html, limit);
  const looksEmpty = /no results/i.test(html);
  if (results.length === 0 && !looksEmpty) {
    throw new SearchError('parse_error', 'Bing document did not match expected structure', true, 'bing');
  }

  return {
    results,
    relatedSearches: [],
  };
}

module.exports = {
  detectBingBlockingState,
  extractBingResults,
  parseBingDocument,
};
