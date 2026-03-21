/**
 * TD-001: DuckDuckGo 搜索之盾 - 类型定义
 *
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-td-001-ddg-shield/03_technical/SPEC.md
 */
/**
 * 搜索提供商名称
 */
export type SearchProviderName = 'gemini' | 'ddg';
/**
 * 健康状态 (状态机定义)
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
/**
 * 错误决策类型
 */
export type ErrorDecision = 'fallback' | 'fatal';
/**
 * 错误来源
 */
export type ErrorSource = 'http_status' | 'timeout' | 'network' | 'response_body' | 'runtime';
/**
 * 错误原因代码
 * 包含 Gemini 和 DDG 所有可能的错误类型
 */
export type ErrorReasonCode = 'gemini_rate_limited' | 'gemini_service_unavailable' | 'gemini_timeout' | 'gemini_network_error' | 'gemini_empty_response' | 'gemini_auth_error' | 'gemini_permission_error' | 'gemini_invalid_request' | 'gemini_circuit_open' | 'ddg_rate_limited' | 'ddg_timeout' | 'ddg_network_error' | 'unknown_error';
/**
 * 搜索请求接口
 * 必须包含：query, count, requestId
 */
export interface SearchRequest {
    /** 搜索关键词 */
    query: string;
    /** 返回结果数量 (默认 10, 最大 50) */
    count?: number;
    /** 请求唯一标识 (用于日志追踪) */
    requestId?: string;
    /** 超时时间 (毫秒，默认 30000) */
    timeoutMs?: number;
    /** 是否允许 Fallback (默认 true) */
    allowFallback?: boolean;
}
/**
 * 搜索请求选项 (内部使用)
 */
export interface SearchProviderOptions {
    signal?: AbortSignal;
}
/**
 * 单个搜索结果项
 */
export interface SearchResultItem {
    /** 结果标题 */
    title: string;
    /** 结果 URL */
    url: string;
    /** 结果摘要/片段 */
    snippet: string;
    /** 相关性评分 (可选) */
    score?: number;
}
/**
 * 搜索响应接口
 * 必须包含 5 个核心指标：provider, items, tookMs, cached, fallbackUsed
 */
export interface SearchResponse {
    /** 1. 实际使用的搜索提供商 ('gemini' | 'ddg') */
    provider: SearchProviderName;
    /** 搜索结果列表 */
    items: SearchResultItem[];
    /** 2. 总耗时 (毫秒) - 从请求开始到响应结束 */
    tookMs: number;
    /** 3. 是否使用缓存 (当前版本暂不支持，预留字段) */
    cached: boolean;
    /** 4. 是否触发 Fallback */
    fallbackUsed: boolean;
    /** 5. 重试次数统计 */
    attempts: {
        gemini: number;
        ddg: number;
    };
    /** 健康状态 (可选，用于调试) */
    healthStatus?: HealthStatus;
    /** 事件 ID (用于审计追踪) */
    eventId?: string;
}
/**
 * Fallback 配置接口
 */
export interface FallbackConfig {
    /** 是否启用 Fallback (默认 true) */
    enabled: boolean;
    /** DDG 最大重试次数 (默认 3) */
    maxDdgRetries: number;
    /** Fallback 决策超时 (毫秒，默认 4000) */
    fallbackDecisionTimeoutMs: number;
    /** Gemini 硬超时 (毫秒，默认 30000) */
    geminiHardTimeoutMs: number;
    /** DDG 超时 (毫秒，默认 8000) */
    ddgTimeoutMs: number;
    /** 空响应触发 Fallback (默认 true) */
    triggerOnEmptyResponse: boolean;
    /** DDG Provider 入口路径 */
    ddgProviderEntry: string;
    /** 健康检查配置 */
    healthCheck: {
        /** 失败阈值 (默认 3) */
        failureThreshold: number;
        /** 熔断超时 (毫秒，默认 300000 = 5 分钟) */
        circuitBreakerTimeoutMs: number;
        /** 恢复阈值 (默认 2) */
        recoveryThreshold: number;
    };
    /** 立即触发 Fallback 的错误代码列表 */
    immediateFallbackErrors: ErrorReasonCode[];
}
/**
 * 默认配置 (TD-001 生产环境配置)
 */
export declare const DEFAULT_DDG_PROVIDER_ENTRY = "/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js";
export declare const DEFAULT_FALLBACK_CONFIG: FallbackConfig;
/**
 * Gemini 健康状态
 */
export interface GeminiHealthStatus {
    status: HealthStatus;
    lastSuccessAt?: number;
    lastFailureAt?: number;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    nextRetryAt?: number;
}
/**
 * 分类后的错误
 */
export interface ClassifiedError {
    decision: ErrorDecision;
    reasonCode: ErrorReasonCode;
    retryable: boolean;
    source: ErrorSource;
    rawMessage: string;
    rawStatus?: number;
}
/**
 * 错误详情接口
 */
export interface SmartSearchErrorDetails {
    /** 错误原因代码 */
    reasonCode: ErrorReasonCode;
    /** 主要错误代码 (如果有级联错误) */
    primaryReasonCode?: ErrorReasonCode;
    /** 是否尝试过 Fallback */
    fallbackTried: boolean;
    /** DDG 尝试次数 */
    ddgAttempts: number;
    /** 最终使用的提供商 */
    finalProvider?: SearchProviderName;
    /** Gemini 错误消息 */
    geminiMessage?: string;
    /** DDG 错误消息 */
    ddgMessage?: string;
    /** HTTP 状态码 (如果有) */
    statusCode?: number;
    /** 事件 ID (用于审计追踪) */
    eventId?: string;
}
/**
 * 智能搜索错误类
 */
export declare class SmartSearchError extends Error {
    readonly details: SmartSearchErrorDetails;
    constructor(message: string, details: SmartSearchErrorDetails);
}
/**
 * 决策超时错误
 */
export declare class DecisionTimeoutError extends Error {
    constructor(message?: string);
}
/**
 * 审计事件类型 (14 种)
 */
export type AuditEventType = 'search.request.started' | 'search.gemini.started' | 'search.gemini.succeeded' | 'search.gemini.failed' | 'search.fallback.triggered' | 'search.ddg.started' | 'search.ddg.succeeded' | 'search.ddg.failed' | 'search.ddg.retry' | 'search.completed' | 'search.failed_final' | 'health.status.changed' | 'health.circuit.opened' | 'health.circuit.closed' | 'health.recovery.attempted';
/**
 * 结构化日志字段 (审计日志)
 * 所有 Fallback 动作必须记录这些字段
 */
export interface AuditLogFields {
    /** 事件 ID (UUID, 用于唯一标识本次搜索) */
    eventId: string;
    /** 请求 ID (来自 SearchRequest.requestId) */
    requestId: string;
    /** 查询哈希 (SHA256(query).slice(0,16), 用于去重) */
    queryHash: string;
    /** 事件类型 */
    eventType: AuditEventType;
    /** 时间戳 (ISO 8601) */
    timestamp: string;
    /** 耗时 (毫秒) */
    elapsedMs: number;
    /** 最终使用的提供商 */
    finalProvider?: SearchProviderName;
    /** 是否使用 Fallback */
    fallbackUsed: boolean;
    /** Gemini 是否尝试 */
    geminiAttempted: boolean;
    /** DDG 是否尝试 */
    ddgAttempted: boolean;
    /** 重试次数 */
    retryCount: number;
    /** 错误代码 (如果有) */
    reasonCode?: ErrorReasonCode;
    /** 错误消息 (如果有) */
    errorMessage?: string;
    /** 健康状态 */
    healthStatus?: HealthStatus;
}
/**
 * 结构化日志接口 (向后兼容)
 */
export interface StructuredLogFields extends AuditLogFields {
}
/**
 * 智能搜索日志器接口
 */
export interface SmartSearchLogger {
    info(event: AuditEventType, fields: AuditLogFields): void;
    warn(event: AuditEventType, fields: AuditLogFields): void;
    error(event: AuditEventType, fields: AuditLogFields): void;
}
/**
 * Provider 搜索响应
 */
export interface ProviderSearchResponse {
    items: SearchResultItem[];
}
/**
 * Gemini 搜索 Provider 接口
 */
export interface GeminiSearchProvider {
    search(input: SearchRequest, options?: SearchProviderOptions): Promise<ProviderSearchResponse>;
}
/**
 * DDG 搜索响应
 */
export interface DdgSearchResponse extends SearchResponse {
}
/**
 * DDG 搜索适配器接口
 */
export interface DdgSearchAdapter {
    search(input: SearchRequest): Promise<DdgSearchResponse>;
}
/**
 * 向后兼容：SmartSearchInput (别名)
 * @deprecated 使用 SearchRequest
 */
export type SmartSearchInput = SearchRequest;
/**
 * 向后兼容：SmartSearchResult (别名)
 * @deprecated 使用 SearchResponse
 */
export type SmartSearchResult = SearchResponse;
