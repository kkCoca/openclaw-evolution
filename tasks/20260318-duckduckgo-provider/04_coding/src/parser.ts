import { load, type CheerioAPI, type Cheerio } from 'cheerio';

import { ProviderError, type SearchResult } from './types.js';

// DuckDuckGo 主站和 HTML 接口通用选择器
// 主站：duckduckgo.com/html/
// HTML 接口：html.duckduckgo.com/html/
const RESULT_SELECTORS = [
  // 主站选择器（优先）
  'a[href*="/l/?uddg="]',
  // HTML 接口选择器（备用）
  '.result a.result__a',
  '.result a.result__title',
];

const MAX_RESULTS = 10;

export class DuckDuckGoHtmlParser {
  parse(html: string): SearchResult[] {
    if (!html.trim()) {
      throw new ProviderError('PARSE_ERROR', 'PARSE_ERROR: empty DuckDuckGo response.', false);
    }

    const $ = load(html);
    const seenUrls = new Set<string>();
    const results: SearchResult[] = [];

    // 尝试不同的选择器
    for (const selector of RESULT_SELECTORS) {
      if (results.length >= MAX_RESULTS) {
        break;
      }

      $(selector).each((_, element) => {
        if (results.length >= MAX_RESULTS) {
          return false;
        }

        const $el = $(element);
        const rawHref = $el.attr('href');
        
        if (!rawHref) {
          return;
        }

        // 提取 URL（处理 DuckDuckGo 重定向链接）
        const url = this.extractRealUrl(rawHref);
        
        if (!url || seenUrls.has(url)) {
          return;
        }

        // 提取标题（可能是当前元素或父元素）
        let title = this.cleanText($el.text());
        if (!title || title.length < 5) {
          // 尝试从父元素获取标题
          title = this.cleanText($el.parent().find('h2, .result__title').first().text());
        }

        // 提取摘要（查找附近的文本）
        let snippet = this.findSnippet($, $el);
        if (!snippet && title) {
          snippet = title; // 如果没有摘要，使用标题
        }

        if (!title || !url) {
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

      // 如果找到了结果，停止尝试其他选择器
      if (results.length > 0) {
        break;
      }
    }

    if (results.length === 0) {
      throw new ProviderError(
        'PARSE_ERROR',
        'PARSE_ERROR: no valid DuckDuckGo results could be extracted. Check if the response contains a CAPTCHA challenge.',
        false,
      );
    }

    return results;
  }

  /**
   * 从 DuckDuckGo 重定向链接中提取真实 URL
   * 格式：//duckduckgo.com/l/?uddg=REAL_URL&rut=HASH
   */
  private extractRealUrl(rawHref: string): string | null {
    if (!rawHref) {
      return null;
    }

    // 处理相对 URL
    const href = rawHref.startsWith('//') ? `https:${rawHref}` : rawHref;

    try {
      const url = new URL(href, 'https://duckduckgo.com');
      
      // 提取 uddg 参数（真实 URL）
      const redirectTarget = url.searchParams.get('uddg');
      
      if (redirectTarget) {
        try {
          const targetUrl = decodeURIComponent(redirectTarget);
          const normalizedUrl = new URL(targetUrl);
          
          // 只接受 HTTP/HTTPS URL
          if (normalizedUrl.protocol !== 'http:' && normalizedUrl.protocol !== 'https:') {
            return null;
          }
          
          return normalizedUrl.toString();
        } catch {
          return null;
        }
      }

      // 如果不是重定向链接，直接返回
      return url.toString();
    } catch {
      return null;
    }
  }

  /**
   * 查找搜索结果摘要
   */
  private findSnippet($: CheerioAPI, $el: Cheerio<any>): string {
    // 策略 1：查找父元素的下一个 link
    const parent = $el.parent();
    const nextLink = parent.find('a').eq(2); // 第三个 link 通常是摘要
    if (nextLink.length > 0) {
      const text = this.cleanText(nextLink.text());
      if (text.length > 20 && text.length < 300) {
        return text;
      }
    }

    // 策略 2：查找兄弟元素
    const nextSibling = parent.next();
    if (nextSibling.length > 0) {
      const text = this.cleanText(nextSibling.text());
      if (text.length > 20 && text.length < 300) {
        return text;
      }
    }

    return '';
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
