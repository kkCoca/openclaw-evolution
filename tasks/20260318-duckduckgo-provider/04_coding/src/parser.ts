import { load } from 'cheerio';

import { ProviderError, type SearchResult } from './types';

const RESULT_SELECTOR = '.result';
const TITLE_SELECTOR = '.result__title .result__a, .result__a';
const SNIPPET_SELECTOR = '.result__snippet';
const MAX_RESULTS = 10;

export class DuckDuckGoHtmlParser {
  parse(html: string): SearchResult[] {
    if (!html.trim()) {
      throw new ProviderError('PARSE_ERROR', 'PARSE_ERROR: empty DuckDuckGo response.', false);
    }

    const $ = load(html);
    const seenUrls = new Set<string>();
    const results: SearchResult[] = [];

    $(RESULT_SELECTOR).each((_, element) => {
      if (results.length >= MAX_RESULTS) {
        return false;
      }

      const title = this.cleanText($(element).find(TITLE_SELECTOR).first().text());
      const snippet = this.cleanText($(element).find(SNIPPET_SELECTOR).first().text());
      const rawHref = $(element).find(TITLE_SELECTOR).first().attr('href');
      const url = this.normalizeUrl(rawHref);

      if (!title || !snippet || !url || seenUrls.has(url)) {
        return;
      }

      seenUrls.add(url);
      results.push({
        title,
        snippet,
        url,
        source: 'duckduckgo',
      });
    });

    if (results.length === 0) {
      throw new ProviderError(
        'PARSE_ERROR',
        'PARSE_ERROR: no valid DuckDuckGo results could be extracted.',
        false,
      );
    }

    return results;
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeUrl(rawHref: string | undefined): string | null {
    if (!rawHref) {
      return null;
    }

    const resolvedHref = rawHref.startsWith('//') ? `https:${rawHref}` : rawHref;

    try {
      const url = new URL(resolvedHref, 'https://html.duckduckgo.com');
      const redirectTarget = url.searchParams.get('uddg');
      const targetUrl = redirectTarget ? decodeURIComponent(redirectTarget) : url.toString();
      const normalizedUrl = new URL(targetUrl);

      if (normalizedUrl.protocol !== 'http:' && normalizedUrl.protocol !== 'https:') {
        return null;
      }

      return normalizedUrl.toString();
    } catch {
      return null;
    }
  }
}
