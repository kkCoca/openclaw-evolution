import { ClassifiedError, DecisionTimeoutError, ErrorReasonCode, SmartSearchError } from './types.js';

type UnknownErrorLike = Error | SmartSearchError | string | Record<string, unknown> | null | undefined;

interface NormalizedError {
  message: string;
  status?: number;
  code?: string;
  name?: string;
}

const NETWORK_PATTERN = /ECONNRESET|ENOTFOUND|EAI_AGAIN|Network Error|fetch failed/i;
const TIMEOUT_PATTERN = /timeout|ETIMEDOUT/i;
const INVALID_REQUEST_PATTERN = /Invalid Query|PARSE_ERROR|schema/i;
const AUTH_PATTERN = /Invalid API Key|Unauthorized/i;

export function classifyError(error: UnknownErrorLike): ClassifiedError {
  const normalized = normalizeError(error);

  if (normalized.status === 429 || /429|Too Many Requests/i.test(normalized.message)) {
    return createClassifiedError('fallback', 'gemini_rate_limited', true, 'http_status', normalized);
  }

  if (normalized.status === 503 || /503|Service Unavailable/i.test(normalized.message)) {
    return createClassifiedError('fallback', 'gemini_service_unavailable', true, 'http_status', normalized);
  }

  if (
    normalized.name === 'AbortError' ||
    normalized.name === 'DecisionTimeoutError' ||
    TIMEOUT_PATTERN.test(normalized.message)
  ) {
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

export function classifyEmptyResponse(): ClassifiedError {
  return {
    decision: 'fallback',
    reasonCode: 'gemini_empty_response',
    retryable: true,
    source: 'response_body',
    rawMessage: 'Gemini returned an empty response.',
  };
}

export function createCircuitOpenClassification(): ClassifiedError {
  return {
    decision: 'fallback',
    reasonCode: 'gemini_circuit_open',
    retryable: true,
    source: 'runtime',
    rawMessage: 'Gemini circuit breaker is open.',
  };
}

function createClassifiedError(
  decision: ClassifiedError['decision'],
  reasonCode: ErrorReasonCode,
  retryable: boolean,
  source: ClassifiedError['source'],
  normalized: NormalizedError,
): ClassifiedError {
  return {
    decision,
    reasonCode,
    retryable,
    source,
    rawMessage: normalized.message,
    rawStatus: normalized.status,
  };
}

function normalizeError(error: UnknownErrorLike): NormalizedError {
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
      status: readNumericProperty(error as unknown as Record<string, unknown>, 'status'),
      code: readStringProperty(error as unknown as Record<string, unknown>, 'code'),
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

function readStringProperty(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumericProperty(input: Record<string, unknown>, key: string): number | undefined {
  const value = input[key];
  return typeof value === 'number' ? value : undefined;
}
