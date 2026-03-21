/**
 * TD-001: DuckDuckGo 搜索之盾 - 错误分类器测试
 *
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 */
import { describe, expect, it } from 'vitest';
import { classifyError, classifyEmptyResponse, createCircuitOpenClassification } from '../src/error-classifier.js';
describe('ErrorClassifier (TD-001)', () => {
    describe('classifyError', () => {
        it('classifies 429 as fallback (gemini_rate_limited)', () => {
            const error = Object.assign(new Error('Too Many Requests'), { status: 429 });
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fallback',
                reasonCode: 'gemini_rate_limited',
                retryable: true,
            });
        });
        it('classifies 503 as fallback (gemini_service_unavailable)', () => {
            const error = Object.assign(new Error('Service Unavailable'), { status: 503 });
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fallback',
                reasonCode: 'gemini_service_unavailable',
                retryable: true,
            });
        });
        it('classifies timeout as fallback (gemini_timeout)', () => {
            const error = new Error('Request timeout');
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fallback',
                reasonCode: 'gemini_timeout',
                retryable: true,
            });
        });
        it('classifies AbortError as fallback (gemini_timeout)', () => {
            const error = Object.assign(new Error('aborted'), { name: 'AbortError' });
            const result = classifyError(error);
            expect(result.reasonCode).toBe('gemini_timeout');
        });
        it('classifies network errors as fallback (gemini_network_error)', () => {
            const error = Object.assign(new Error('fetch failed'), { code: 'ECONNRESET' });
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fallback',
                reasonCode: 'gemini_network_error',
                retryable: true,
            });
        });
        it('classifies 401 as fatal (gemini_auth_error)', () => {
            const error = Object.assign(new Error('Unauthorized'), { status: 401 });
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fatal',
                reasonCode: 'gemini_auth_error',
                retryable: false,
            });
        });
        it('classifies 403 as fatal (gemini_permission_error)', () => {
            const error = Object.assign(new Error('Forbidden'), { status: 403 });
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fatal',
                reasonCode: 'gemini_permission_error',
                retryable: false,
            });
        });
        it('classifies invalid request as fatal (gemini_invalid_request)', () => {
            const error = new Error('Invalid Query');
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fatal',
                reasonCode: 'gemini_invalid_request',
                retryable: false,
            });
        });
        it('classifies unknown errors as fatal', () => {
            const error = new Error('Something went wrong');
            const result = classifyError(error);
            expect(result).toMatchObject({
                decision: 'fatal',
                reasonCode: 'unknown_error',
                retryable: false,
            });
        });
        it('handles string errors', () => {
            const result = classifyError('error message');
            expect(result.rawMessage).toBe('error message');
        });
        it('handles null/undefined errors', () => {
            expect(classifyError(null)).toMatchObject({ rawMessage: 'Unknown error' });
            expect(classifyError(undefined)).toMatchObject({ rawMessage: 'Unknown error' });
        });
    });
    describe('classifyEmptyResponse', () => {
        it('returns fallback decision for empty response', () => {
            const result = classifyEmptyResponse();
            expect(result).toMatchObject({
                decision: 'fallback',
                reasonCode: 'gemini_empty_response',
                retryable: true,
            });
        });
    });
    describe('createCircuitOpenClassification', () => {
        it('returns fallback decision for circuit open', () => {
            const result = createCircuitOpenClassification();
            expect(result).toMatchObject({
                decision: 'fallback',
                reasonCode: 'gemini_circuit_open',
                retryable: true,
                rawMessage: 'Gemini circuit breaker is open.',
            });
        });
    });
});
