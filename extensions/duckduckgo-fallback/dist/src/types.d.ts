export type SearchProviderName = 'gemini' | 'ddg';
export type ErrorDecision = 'fallback' | 'fatal';
export type ErrorReasonCode = 'gemini_rate_limited' | 'gemini_service_unavailable' | 'gemini_timeout' | 'gemini_network_error' | 'gemini_empty_response' | 'gemini_auth_error' | 'gemini_permission_error' | 'gemini_invalid_request' | 'gemini_circuit_open' | 'unknown_error';
export type ErrorSource = 'http_status' | 'timeout' | 'network' | 'response_body' | 'runtime';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export interface SmartSearchInput {
    query: string;
    count?: number;
    requestId?: string;
}
export interface SearchResultItem {
    title: string;
    url: string;
    snippet: string;
}
export interface SmartSearchResult {
    provider: SearchProviderName;
    items: SearchResultItem[];
    fallbackUsed: boolean;
    timingMs: number;
    attempts: {
        gemini: number;
        ddg: number;
    };
}
export interface FallbackConfig {
    enabled: boolean;
    maxDdgRetries: number;
    fallbackDecisionTimeoutMs: number;
    geminiHardTimeoutMs: number;
    ddgTimeoutMs: number;
    triggerOnEmptyResponse: boolean;
    ddgProviderEntry: string;
    healthCheck: {
        failureThreshold: number;
        circuitBreakerTimeoutMs: number;
        recoveryThreshold: number;
    };
}
export interface ClassifiedError {
    decision: ErrorDecision;
    reasonCode: ErrorReasonCode;
    retryable: boolean;
    source: ErrorSource;
    rawMessage: string;
    rawStatus?: number;
}
export interface SearchProviderOptions {
    signal?: AbortSignal;
}
export interface ProviderSearchResponse {
    items: SearchResultItem[];
}
export interface GeminiSearchProvider {
    search(input: SmartSearchInput, options?: SearchProviderOptions): Promise<ProviderSearchResponse>;
}
export interface DdgSearchResponse extends SmartSearchResult {
}
export interface DdgSearchAdapter {
    search(input: SmartSearchInput): Promise<DdgSearchResponse>;
}
export interface StructuredLogFields {
    requestId: string;
    queryHash: string;
    reasonCode?: ErrorReasonCode;
    occurredAt: string;
    elapsedMs: number;
    retryCount: number;
    finalProvider?: SearchProviderName;
    fallbackUsed: boolean;
    geminiAttempted: boolean;
    ddgAttempted: boolean;
    errorMessage?: string;
}
export interface SmartSearchLogger {
    info(event: string, fields: StructuredLogFields): void;
    warn(event: string, fields: StructuredLogFields): void;
    error(event: string, fields: StructuredLogFields): void;
}
export interface GeminiHealthStatus {
    status: HealthStatus;
    lastSuccessAt?: number;
    lastFailureAt?: number;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    nextRetryAt?: number;
}
export interface SmartSearchErrorDetails {
    reasonCode: ErrorReasonCode;
    primaryReasonCode?: ErrorReasonCode;
    fallbackTried: boolean;
    ddgAttempts: number;
    finalProvider?: SearchProviderName;
    geminiMessage?: string;
    ddgMessage?: string;
    statusCode?: number;
}
export declare class SmartSearchError extends Error {
    readonly details: SmartSearchErrorDetails;
    constructor(message: string, details: SmartSearchErrorDetails);
}
export declare class DecisionTimeoutError extends Error {
    constructor(message?: string);
}
export declare const DEFAULT_DDG_PROVIDER_ENTRY = "/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js";
export declare const DEFAULT_FALLBACK_CONFIG: FallbackConfig;
