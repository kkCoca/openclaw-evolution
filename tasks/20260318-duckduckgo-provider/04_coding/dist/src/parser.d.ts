import { type SearchResult } from './types.js';
export declare class DuckDuckGoHtmlParser {
    parse(html: string): SearchResult[];
    /**
     * 从 DuckDuckGo 重定向链接中提取真实 URL
     * 格式：//duckduckgo.com/l/?uddg=REAL_URL&rut=HASH
     */
    private extractRealUrl;
    /**
     * 查找搜索结果摘要
     */
    private findSnippet;
    private cleanText;
}
