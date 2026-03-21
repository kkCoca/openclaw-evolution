/**
 * TD-001: DuckDuckGo 搜索之盾 - 类型定义
 *
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-duckduckgo-fallback/03_detailing/SPEC.md
 */
/**
 * 默认配置 (TD-001 生产环境配置)
 */
export const DEFAULT_DDG_PROVIDER_ENTRY = '/home/ouyp/.openclaw/workspace/universe-bridge/extensions/search_providers/duckduckgo/dist/src/index.js';
export const DEFAULT_FALLBACK_CONFIG = {
    enabled: true,
    maxDdgRetries: 3,
    fallbackDecisionTimeoutMs: 4000, // TD-001: 从 4500 优化至 4000
    geminiHardTimeoutMs: 30000,
    ddgTimeoutMs: 8000, // TD-001: 从 12000 优化至 8000
    triggerOnEmptyResponse: true,
    ddgProviderEntry: DEFAULT_DDG_PROVIDER_ENTRY,
    healthCheck: {
        failureThreshold: 3,
        circuitBreakerTimeoutMs: 300000, // 5 分钟熔断
        recoveryThreshold: 2,
    },
    immediateFallbackErrors: [
        'gemini_rate_limited',
        'gemini_service_unavailable',
        'gemini_timeout',
        'gemini_circuit_open',
    ],
};
/**
 * 智能搜索错误类
 */
export class SmartSearchError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.name = 'SmartSearchError';
        this.details = details;
    }
}
/**
 * 决策超时错误
 */
export class DecisionTimeoutError extends Error {
    constructor(message = 'Gemini fallback decision timeout exceeded.') {
        super(message);
        this.name = 'DecisionTimeoutError';
    }
}
