import { describe, expect, it } from 'vitest';
import { DuckDuckGoHtmlParser } from '../src/parser';
const SAMPLE_HTML = `
  <html>
    <body>
      <div class="result">
        <h2 class="result__title">
          <a class="result__a" href="https://example.com/article">Example Title</a>
        </h2>
        <a class="result__url" href="https://example.com/article">example.com/article</a>
        <div class="result__snippet"> Example snippet for the first result. </div>
      </div>
      <div class="result">
        <h2 class="result__title">
          <a class="result__a" href="//docs.example.org/path">Second Title</a>
        </h2>
        <div class="result__snippet">Second snippet</div>
      </div>
      <div class="result">
        <h2 class="result__title">
          <a class="result__a" href="javascript:alert('x')">Bad Result</a>
        </h2>
        <div class="result__snippet">Should be removed</div>
      </div>
      <div class="result">
        <h2 class="result__title">
          <a class="result__a" href="https://example.com/article">Example Title Again</a>
        </h2>
        <div class="result__snippet">Duplicate URL</div>
      </div>
      <div class="result">
        <h2 class="result__title"></h2>
        <div class="result__snippet">Missing title</div>
      </div>
    </body>
  </html>
`;
describe('DuckDuckGoHtmlParser', () => {
    it('extracts valid results and normalizes protocol-relative URLs', () => {
        const parser = new DuckDuckGoHtmlParser();
        const results = parser.parse(SAMPLE_HTML);
        expect(results).toEqual([
            {
                title: 'Example Title',
                snippet: 'Example snippet for the first result.',
                url: 'https://example.com/article',
                source: 'duckduckgo',
            },
            {
                title: 'Second Title',
                snippet: 'Second snippet',
                url: 'https://docs.example.org/path',
                source: 'duckduckgo',
            },
        ]);
    });
    it('limits parsed results to the first ten valid entries', () => {
        const parser = new DuckDuckGoHtmlParser();
        const html = Array.from({ length: 12 }, (_, index) => {
            return `
        <div class="result">
          <h2 class="result__title">
            <a class="result__a" href="https://example.com/${index}">Title ${index}</a>
          </h2>
          <div class="result__snippet">Snippet ${index}</div>
        </div>
      `;
        }).join('');
        const results = parser.parse(`<html><body>${html}</body></html>`);
        expect(results).toHaveLength(10);
        expect(results[0]?.url).toBe('https://example.com/0');
        expect(results[9]?.url).toBe('https://example.com/9');
    });
    it('throws a parse error when no valid result can be extracted', () => {
        const parser = new DuckDuckGoHtmlParser();
        expect(() => parser.parse('<html><body><div>No results</div></body></html>')).toThrowError(/PARSE_ERROR/);
    });
});
