import { DecisionTimeoutError, SmartSearchError } from './types.js';
const NETWORK_PATTERN = /ECONNRESET|ENOTFOUND|EAI_AGAIN|Network Error|fetch failed/i;
const TIMEOUT_PATTERN = /timeout|ETIMEDOUT/i;
const INVALID_REQUEST_PATTERN = /Invalid Query|PARSE_ERROR|schema/i;
const AUTH_PATTERN = /Invalid API Key|Unauthorized/i;
export function classifyError(error) {
    const normalized = normalizeError(error);
    if (normalized.status === 429 || /429|Too Many Requests/i.test(normalized.message)) {
        return createClassifiedError('fallback', 'gemini_rate_limited', true, 'http_status', normalized);
    }
    if (normalized.status === 503 || /503|Service Unavailable/i.test(normalized.message)) {
        return createClassifiedError('fallback', 'gemini_service_unavailable', true, 'http_status', normalized);
    }
    if (normalized.name === 'AbortError' ||
        normalized.name === 'DecisionTimeoutError' ||
        TIMEOUT_PATTERN.test(normalized.message)) {
        return createClassifiedError('fallback', 'gemini_timeout', true, 'timeout', normalized);
    }
    if (NETWORK_PATTERN.test(normalized.code ?? '') || NETWORK_PATTERN.test(normalized.message)) {
        return createClassifiedError('fallback', 'gemini_network_error', true, 'network', normalized);
    }
    if (normalized.status === 401 || AUTH_PATTERN.test(normalized.message)) {
        return createClassifiedError('fatal', 'gemini_auth_error', false, 'http_status', normalized);
    }
    if (normalized.status === 403 || /Forbidden/i.test(normalized.message)) {
        return createClassifiedError('fatal', 'gemini_permission_error', false, 'http_status', normalized);
    }
    if (INVALID_REQUEST_PATTERN.test(normalized.message)) {
        return createClassifiedError('fatal', 'gemini_invalid_request', false, 'runtime', normalized);
    }
    return createClassifiedError('fatal', 'unknown_error', false, 'runtime', normalized);
}
export function classifyEmptyResponse() {
    return {
        decision: 'fallback',
        reasonCode: 'gemini_empty_response',
        retryable: true,
        source: 'response_body',
        rawMessage: 'Gemini returned an empty response.',
    };
}
export function createCircuitOpenClassification() {
    return {
        decision: 'fallback',
        reasonCode: 'gemini_circuit_open',
        retryable: true,
        source: 'runtime',
        rawMessage: 'Gemini circuit breaker is open.',
    };
}
function createClassifiedError(decision, reasonCode, retryable, source, normalized) {
    return {
        decision,
        reasonCode,
        retryable,
        source,
        rawMessage: normalized.message,
        rawStatus: normalized.status,
    };
}
function normalizeError(error) {
    if (error instanceof SmartSearchError) {
        return {
            message: error.message,
            status: error.details.statusCode,
            name: error.name,
        };
    }
    if (error instanceof DecisionTimeoutError) {
        return {
            message: error.message,
            name: error.name,
        };
    }
    if (error instanceof Error) {
        return {
            message: error.message,
            status: readNumericProperty(error, 'status'),
            code: readStringProperty(error, 'code'),
            name: error.name,
        };
    }
    if (typeof error === 'string') {
        return { message: error };
    }
    if (error && typeof error === 'object') {
        return {
            message: readStringProperty(error, 'message') ?? 'Unknown error',
            status: readNumericProperty(error, 'status'),
            code: readStringProperty(error, 'code'),
            name: readStringProperty(error, 'name'),
        };
    }
    return { message: 'Unknown error' };
}
function readStringProperty(input, key) {
    const value = input[key];
    return typeof value === 'string' ? value : undefined;
}
function readNumericProperty(input, key) {
    const value = input[key];
    return typeof value === 'number' ? value : undefined;
}
