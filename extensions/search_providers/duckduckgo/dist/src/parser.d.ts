import { type SearchResult } from './types.js';
export declare class DuckDuckGoHtmlParser {
    parse(html: string): SearchResult[];
    private cleanText;
    private normalizeUrl;
}
