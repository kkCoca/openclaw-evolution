/**
 * TD-001: DuckDuckGo 搜索之盾 - Fallback 管理器
 *
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-duckduckgo-fallback/03_detailing/SPEC.md
 */
import { DdgSearchAdapter, FallbackConfig, GeminiHealthStatus, GeminiSearchProvider, SearchRequest, SearchResponse, SmartSearchLogger } from './types.js';
interface FallbackManagerOptions {
    config: FallbackConfig;
    geminiProvider: GeminiSearchProvider;
    ddgAdapter: DdgSearchAdapter;
    logger: SmartSearchLogger;
    now?: () => number;
}
export declare class FallbackManager {
    private readonly config;
    private readonly geminiProvider;
    private readonly ddgAdapter;
    private readonly logger;
    private readonly now;
    constructor(options: FallbackManagerOptions);
    /**
     * 执行智能搜索 (主入口)
     *
     * 逻辑流程：
     * 1. 生成 EventID (审计追踪)
     * 2. 检查熔断状态 (防死循环)
     * 3. 尝试 Gemini 搜索
     * 4. 失败时分类错误并决定是否 Fallback
     * 5. 执行 DDG Fallback (含重试)
     * 6. 记录完整审计日志
     */
    executeSearch(input: SearchRequest): Promise<SearchResponse>;
    /**
     * 执行 Gemini 搜索 (含超时控制)
     */
    private executeGemini;
    /**
     * 执行 DDG Fallback (含重试逻辑)
     *
     * ⚠️ 防死循环：DDG 失败后不重试 Gemini，直接抛出最终错误
     */
    private executeDdgFallback;
    /**
     * 创建致命错误 (不触发 Fallback)
     */
    private createFatalError;
    /**
     * 获取熔断状态分类
     *
     * TD-001: 熔断期间直接返回分类，跳过 Gemini 尝试 (防死循环)
     */
    private getCircuitOpenClassification;
    /**
     * 记录 Gemini 失败
     *
     * TD-001: 连续失败≥3 次触发熔断
     */
    private recordGeminiFailure;
    /**
     * 记录 Gemini 成功
     *
     * TD-001: 连续成功≥2 次恢复健康状态
     */
    private recordGeminiSuccess;
    /**
     * 构建审计日志字段 (EventID 挂载)
     */
    private buildLog;
    /**
     * 构建健康状态日志
     */
    private buildHealthLog;
    /**
     * 生成 EventID (审计追踪)
     * 格式：{timestamp}-{uuid}
     */
    private generateEventId;
    /**
     * 生成查询哈希 (隐私保护)
     */
    private hashQuery;
}
/**
 * 获取 Gemini 健康状态
 */
export declare function getGeminiHealthStatus(): GeminiHealthStatus;
/**
 * 重置 Gemini 健康状态 (测试用)
 */
export declare function resetGeminiHealthStatus(): void;
export {};
