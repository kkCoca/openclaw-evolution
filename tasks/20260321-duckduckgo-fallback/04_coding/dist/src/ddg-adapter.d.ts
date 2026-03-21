/**
 * TD-001: DuckDuckGo 搜索之盾 - DDG 适配器
 *
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-td-001-ddg-shield/03_technical/SPEC.md
 */
import { DdgSearchAdapter, DdgSearchResponse, SearchRequest } from './types.js';
interface DdgProviderResult {
    results?: Array<{
        title?: string;
        url?: string;
        snippet?: string;
    }>;
}
interface DdgProviderInstance {
    search(input: SearchRequest): Promise<DdgProviderResult>;
}
export interface DdgAdapterOptions {
    providerEntry?: string;
    providerFactory?: () => Promise<DdgProviderInstance>;
    now?: () => number;
}
export declare class DdgAdapter implements DdgSearchAdapter {
    private readonly providerFactory;
    private readonly now;
    constructor(options?: DdgAdapterOptions);
    /**
     * 执行 DuckDuckGo 搜索
     *
     * TD-001: 符合 SPEC 3.2 SearchResponse 接口
     */
    search(input: SearchRequest): Promise<DdgSearchResponse>;
}
export {};
