import { describe, expect, it } from 'vitest';

import { classifyEmptyResponse, classifyError, createCircuitOpenClassification } from '../src/error-classifier.js';
import { DecisionTimeoutError } from '../src/types.js';

describe('classifyError', () => {
  it('classifies 429 as fallback', () => {
    expect(classifyError({ status: 429, message: 'Too Many Requests' })).toMatchObject({
      decision: 'fallback',
      reasonCode: 'gemini_rate_limited',
    });
  });

  it('classifies 503 as fallback', () => {
    expect(classifyError({ status: 503, message: 'Service Unavailable' })).toMatchObject({
      decision: 'fallback',
      reasonCode: 'gemini_service_unavailable',
    });
  });

  it('classifies timeout errors as fallback', () => {
    expect(classifyError(new DecisionTimeoutError())).toMatchObject({
      decision: 'fallback',
      reasonCode: 'gemini_timeout',
    });
  });

  it('classifies network errors as fallback', () => {
    expect(classifyError({ code: 'ECONNRESET', message: 'fetch failed' })).toMatchObject({
      decision: 'fallback',
      reasonCode: 'gemini_network_error',
    });
  });

  it('classifies empty responses when requested', () => {
    expect(classifyEmptyResponse()).toMatchObject({
      decision: 'fallback',
      reasonCode: 'gemini_empty_response',
    });
  });

  it('classifies auth and permission issues as fatal', () => {
    expect(classifyError({ status: 401, message: 'Unauthorized' }).reasonCode).toBe('gemini_auth_error');
    expect(classifyError({ status: 403, message: 'Forbidden' }).reasonCode).toBe('gemini_permission_error');
  });

  it('classifies invalid requests as fatal', () => {
    expect(classifyError(new Error('PARSE_ERROR bad request'))).toMatchObject({
      decision: 'fatal',
      reasonCode: 'gemini_invalid_request',
    });
  });

  it('creates a circuit-open fallback classification', () => {
    expect(createCircuitOpenClassification()).toMatchObject({
      decision: 'fallback',
      reasonCode: 'gemini_circuit_open',
    });
  });
});
