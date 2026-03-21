/**
 * TD-001: DuckDuckGo 搜索之盾 - Fallback 测试
 *
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-td-001-ddg-shield/03_technical/SPEC.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSmartSearchRuntime } from '../src/index.js';
import { getGeminiHealthStatus, resetGeminiHealthStatus } from '../src/fallback-manager.js';
import { DEFAULT_FALLBACK_CONFIG, SmartSearchError } from '../src/types.js';
function createLogger(events) {
    return {
        info(event, fields) {
            events.push({ event, fields });
        },
        warn(event, fields) {
            events.push({ event, fields });
        },
        error(event, fields) {
            events.push({ event, fields });
        },
    };
}
describe('smartSearch fallback flow (TD-001)', () => {
    beforeEach(() => {
        resetGeminiHealthStatus();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    /**
     * 测试 1: Gemini 成功返回
     * 验证：不触发 Fallback，EventID 存在
     */
    it('returns Gemini result when Gemini succeeds', async () => {
        const events = [];
        const geminiProvider = {
            async search() {
                return {
                    items: [{ title: 'Gemini', url: 'https://gemini.example', snippet: 'Primary result' }],
                };
            },
        };
        const runtime = createSmartSearchRuntime({
            geminiProvider,
            ddgAdapter: {
                async search() {
                    throw new Error('should not call ddg');
                },
            },
            logger: createLogger(events),
        });
        const result = await runtime.smartSearch({ query: 'hello world' });
        expect(result).toMatchObject({
            provider: 'gemini',
            fallbackUsed: false,
            attempts: { gemini: 1, ddg: 0 },
            eventId: expect.stringMatching(/^\d{14}-[0-9a-f-]{36}$/), // EventID 格式验证
        });
        expect(events.some((event) => event.event === 'search.gemini.succeeded')).toBe(true);
        expect(events.some((event) => event.event === 'search.completed')).toBe(true);
    });
    /**
     * 测试 2: 429 限流触发 Fallback
     * 验证：EventID 挂载，结构化日志字段完整
     */
    it('falls back to DDG on 429 and records structured fields', async () => {
        const events = [];
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Too Many Requests'), { status: 429 });
                },
            },
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Fallback result' }],
                        tookMs: 10,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
        });
        const result = await runtime.smartSearch({ query: 'fallback me', requestId: 'req-1' });
        expect(result).toMatchObject({
            provider: 'ddg',
            fallbackUsed: true,
            attempts: { gemini: 1, ddg: 1 },
            eventId: expect.stringMatching(/^\d{14}-[0-9a-f-]{36}$/),
        });
        // Note: DDG adapter returns its own attempts, but FallbackManager overrides with context.attempts
        // The result shows gemini: 1 because FallbackManager already incremented before calling DDG
        const fallbackEvent = events.find((event) => event.event === 'search.fallback.triggered');
        expect(fallbackEvent?.fields).toMatchObject({
            requestId: 'req-1',
            reasonCode: 'gemini_rate_limited',
            fallbackUsed: true,
            geminiAttempted: true,
            ddgAttempted: false,
            eventId: expect.stringMatching(/^\d{14}-[0-9a-f-]{36}$/),
        });
        expect(typeof fallbackEvent?.fields.queryHash).toBe('string');
    });
    /**
     * 测试 3: Gemini 超时，<5 秒内触发 Fallback
     * 验证：决策超时≤4000ms，符合<5 秒 SLA
     */
    it('decides fallback within five seconds when Gemini hangs', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-19T00:00:00.000Z'));
        const events = [];
        const geminiProvider = {
            async search(_input, options) {
                return await new Promise((resolve, reject) => {
                    options?.signal?.addEventListener('abort', () => {
                        reject(new Error('aborted by timeout'));
                    });
                    void resolve;
                });
            },
        };
        const runtime = createSmartSearchRuntime({
            geminiProvider,
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Timeout fallback' }],
                        tookMs: 20,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
            now: Date.now,
        });
        const pending = runtime.smartSearch({ query: 'slow query' });
        await vi.advanceTimersByTimeAsync(4000); // TD-001: 从 4500 优化至 4000
        const result = await pending;
        expect(result.provider).toBe('ddg');
        const fallbackEvent = events.find((event) => event.event === 'search.fallback.triggered');
        expect(fallbackEvent?.fields.reasonCode).toBe('gemini_timeout');
        expect(fallbackEvent?.fields.elapsedMs).toBeLessThanOrEqual(4000); // TD-001: <5 秒 SLA
    });
    /**
     * 测试 4: 认证错误直接报错，不触发 Fallback
     * 验证：防死循环机制 (fatal 错误不 Fallback)
     */
    it('throws fatal auth errors without fallback', async () => {
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Unauthorized'), { status: 401 });
                },
            },
            ddgAdapter: {
                async search() {
                    throw new Error('should not fallback');
                },
            },
        });
        await expect(runtime.smartSearch({ query: 'secret' })).rejects.toMatchObject({
            details: {
                reasonCode: 'gemini_auth_error',
                fallbackTried: false,
            },
        });
    });
    /**
     * 测试 5: DDG 重试逻辑
     * 验证：失败后重试，成功后返回
     */
    it('retries DDG and eventually succeeds', async () => {
        const events = [];
        let ddgCalls = 0;
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Service Unavailable'), { status: 503 });
                },
            },
            ddgAdapter: {
                async search() {
                    ddgCalls += 1;
                    if (ddgCalls < 2) {
                        throw new Error('temporary ddg issue');
                    }
                    return {
                        provider: 'ddg',
                        items: [{ title: 'Recovered', url: 'https://ddg.example', snippet: 'Recovered result' }],
                        tookMs: 5,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
        });
        const result = await runtime.smartSearch({ query: 'retry please' });
        // FallbackManager 使用 context.attempts，所以 ddg 应该是实际调用次数
        expect(result.attempts.ddg).toBe(ddgCalls);
        expect(events.some((event) => event.event === 'search.ddg.retry')).toBe(true);
    });
    /**
     * 测试 6: DDG 耗尽重试后抛出最终错误
     * 验证：防死循环 (不重试 Gemini)
     */
    it('throws a final error after DDG exhausts retries', async () => {
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Service Unavailable'), { status: 503 });
                },
            },
            ddgAdapter: {
                async search() {
                    throw new Error('ddg failed');
                },
            },
        });
        await expect(runtime.smartSearch({ query: 'fail all' })).rejects.toBeInstanceOf(SmartSearchError);
        await expect(runtime.smartSearch({ query: 'fail all' })).rejects.toMatchObject({
            details: {
                primaryReasonCode: 'gemini_service_unavailable',
                fallbackTried: true,
                ddgAttempts: DEFAULT_FALLBACK_CONFIG.maxDdgRetries,
                finalProvider: 'ddg',
                eventId: expect.stringMatching(/^\d{14}-[0-9a-f-]{36}$/),
            },
        });
    });
    /**
     * 测试 7: 健康状态跨请求共享 + 熔断恢复
     * 验证：状态机流转 (Healthy → Degraded → Unhealthy → Degraded → Healthy)
     */
    it('shares Gemini health across requests and recovers after cooldown', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-19T00:00:00.000Z'));
        let geminiCalls = 0;
        const ddgAdapter = {
            async search() {
                return {
                    provider: 'ddg',
                    items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Fallback result' }],
                    tookMs: 1,
                    cached: false,
                    fallbackUsed: true,
                    attempts: { gemini: 0, ddg: 1 },
                };
            },
        };
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    geminiCalls += 1;
                    if (geminiCalls <= 3) {
                        throw Object.assign(new Error('Service Unavailable'), { status: 503 });
                    }
                    return {
                        items: [{ title: 'Gemini', url: 'https://gemini.example', snippet: 'Recovered' }],
                    };
                },
            },
            ddgAdapter,
            now: Date.now,
        });
        // 连续 3 次失败 → Unhealthy
        await runtime.smartSearch({ query: '1' });
        await runtime.smartSearch({ query: '2' });
        await runtime.smartSearch({ query: '3' });
        expect(getGeminiHealthStatus().status).toBe('unhealthy');
        // 第 4 次：熔断期间，跳过 Gemini
        await runtime.smartSearch({ query: '4' });
        expect(geminiCalls).toBe(3);
        // 5 分钟后：尝试恢复 → Degraded
        await vi.advanceTimersByTimeAsync(DEFAULT_FALLBACK_CONFIG.healthCheck.circuitBreakerTimeoutMs);
        await runtime.smartSearch({ query: '5' });
        expect(getGeminiHealthStatus().status).toBe('degraded');
        // 连续 2 次成功 → Healthy
        await runtime.smartSearch({ query: '6' });
        expect(getGeminiHealthStatus().status).toBe('healthy');
    });
    /**
     * 测试 8: EventID 唯一性验证
     * 验证：每次搜索生成唯一 EventID
     */
    it('generates unique EventID for each search', async () => {
        const events = [];
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    return { items: [{ title: 'Test', url: 'https://test.example', snippet: 'Test' }] };
                },
            },
            logger: createLogger(events),
        });
        const result1 = await runtime.smartSearch({ query: 'test 1' });
        const result2 = await runtime.smartSearch({ query: 'test 2' });
        expect(result1.eventId).toBeDefined();
        expect(result2.eventId).toBeDefined();
        expect(result1.eventId).not.toBe(result2.eventId);
    });
    /**
     * 测试 9: 空响应触发 Fallback
     * 验证：triggerOnEmptyResponse=true 时，空响应触发 Fallback
     */
    it('triggers fallback on empty response', async () => {
        const events = [];
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    return { items: [] }; // 空响应
                },
            },
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Empty fallback' }],
                        tookMs: 5,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
        });
        const result = await runtime.smartSearch({ query: 'empty' });
        expect(result.provider).toBe('ddg');
        expect(result.fallbackUsed).toBe(true);
        expect(events.some((event) => event.event === 'search.gemini.failed')).toBe(true);
    });
    /**
     * 测试 10: 熔断期间直接走 Fallback
     * 验证：Unhealthy 状态下不尝试 Gemini
     */
    it('skips Gemini and goes directly to DDG during circuit open', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-19T00:00:00.000Z'));
        const events = [];
        let geminiCalls = 0;
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    geminiCalls += 1;
                    throw Object.assign(new Error('Service Unavailable'), { status: 503 });
                },
            },
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Circuit fallback' }],
                        tookMs: 1,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
            now: Date.now,
        });
        // 连续 3 次失败 → Unhealthy
        await runtime.smartSearch({ query: '1' });
        await runtime.smartSearch({ query: '2' });
        await runtime.smartSearch({ query: '3' });
        expect(getGeminiHealthStatus().status).toBe('unhealthy');
        // 第 4 次：熔断期间，应跳过 Gemini
        await runtime.smartSearch({ query: '4' });
        expect(geminiCalls).toBe(3); // 不应增加
        const circuitEvent = events.find((event) => event.event === 'health.circuit.opened');
        expect(circuitEvent).toBeDefined();
    });
    /**
     * 测试 11: 立即触发 Fallback (429/503/Timeout)
     * 验证：immediateFallbackErrors 配置生效
     */
    it('immediately triggers fallback for 429/503/Timeout errors', async () => {
        const events = [];
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Too Many Requests'), { status: 429 });
                },
            },
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Immediate fallback' }],
                        tookMs: 5,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
        });
        const result = await runtime.smartSearch({ query: 'immediate' });
        expect(result.provider).toBe('ddg');
        expect(result.fallbackUsed).toBe(true);
        // 验证没有等待决策超时
        const fallbackEvent = events.find((event) => event.event === 'search.fallback.triggered');
        expect(fallbackEvent?.fields.reasonCode).toBe('gemini_rate_limited');
    });
    /**
     * 测试 12: 审计日志字段完整性
     * 验证：所有审计事件包含完整字段
     */
    it('records complete audit log fields', async () => {
        const events = [];
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Service Unavailable'), { status: 503 });
                },
            },
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Audit test' }],
                        tookMs: 10,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
        });
        await runtime.smartSearch({ query: 'audit test', requestId: 'audit-1' });
        // 验证所有事件都有完整字段
        events.forEach((event) => {
            expect(event.fields.eventId).toBeDefined();
            expect(event.fields.requestId).toBeDefined();
            expect(event.fields.queryHash).toBeDefined();
            expect(event.fields.eventType).toBeDefined();
            expect(event.fields.timestamp).toBeDefined();
            expect(typeof event.fields.elapsedMs).toBe('number');
            expect(typeof event.fields.fallbackUsed).toBe('boolean');
            expect(typeof event.fields.geminiAttempted).toBe('boolean');
            expect(typeof event.fields.ddgAttempted).toBe('boolean');
            expect(typeof event.fields.retryCount).toBe('number');
        });
    });
    /**
     * 测试 13: SearchResponse 5 核心指标验证
     * 验证：符合 SPEC 3.2 接口定义
     */
    it('includes all 5 core metrics in SearchResponse', async () => {
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    return { items: [{ title: 'Test', url: 'https://test.example', snippet: 'Core metrics' }] };
                },
            },
        });
        const result = await runtime.smartSearch({ query: 'core metrics' });
        // 验证 5 核心指标
        expect(result).toHaveProperty('provider');
        expect(result).toHaveProperty('items');
        expect(result).toHaveProperty('tookMs');
        expect(result).toHaveProperty('cached');
        expect(result).toHaveProperty('fallbackUsed');
        expect(result).toHaveProperty('attempts');
        // 验证类型
        expect(typeof result.provider).toBe('string');
        expect(Array.isArray(result.items));
        expect(typeof result.tookMs).toBe('number');
        expect(typeof result.cached).toBe('boolean');
        expect(typeof result.fallbackUsed).toBe('boolean');
        expect(typeof result.attempts).toBe('object');
    });
    /**
     * 测试 14: 健康状态变更日志
     * 验证：状态机流转记录完整
     */
    it('records health status change events', async () => {
        const events = [];
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Service Unavailable'), { status: 503 });
                },
            },
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Health test' }],
                        tookMs: 1,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
            logger: createLogger(events),
        });
        await runtime.smartSearch({ query: '1' });
        await runtime.smartSearch({ query: '2' });
        await runtime.smartSearch({ query: '3' });
        // 验证健康状态变更事件
        expect(events.some((event) => event.event === 'health.status.changed')).toBe(true);
        expect(events.some((event) => event.event === 'health.circuit.opened')).toBe(true);
    });
    /**
     * 测试 15: DDG 失败后不重试 Gemini (防死循环)
     * 验证：最终错误抛出，无递归
     */
    it('does not retry Gemini after DDG fails (anti-loop)', async () => {
        let geminiCalls = 0;
        const runtime = createSmartSearchRuntime({
            geminiProvider: {
                async search() {
                    geminiCalls += 1;
                    throw Object.assign(new Error('Service Unavailable'), { status: 503 });
                },
            },
            ddgAdapter: {
                async search() {
                    throw new Error('ddg failed');
                },
            },
        });
        await expect(runtime.smartSearch({ query: 'loop test' })).rejects.toBeInstanceOf(SmartSearchError);
        // 验证 Gemini 只被调用 1 次 (无重试)
        expect(geminiCalls).toBe(1);
    });
    /**
     * 测试 16: 配置优先级验证
     * 验证：自定义配置覆盖默认配置
     */
    it('respects custom config over default config', async () => {
        const runtime = createSmartSearchRuntime({
            config: {
                fallbackDecisionTimeoutMs: 2000, // 自定义 2 秒
                maxDdgRetries: 1, // 自定义 1 次重试
            },
            geminiProvider: {
                async search() {
                    throw Object.assign(new Error('Timeout'), { message: 'timeout' });
                },
            },
            ddgAdapter: {
                async search() {
                    return {
                        provider: 'ddg',
                        items: [{ title: 'DDG', url: 'https://ddg.example', snippet: 'Config test' }],
                        tookMs: 5,
                        cached: false,
                        fallbackUsed: true,
                        attempts: { gemini: 0, ddg: 1 },
                    };
                },
            },
        });
        const result = await runtime.smartSearch({ query: 'config test' });
        expect(result.provider).toBe('ddg');
        expect(result.attempts.ddg).toBeLessThanOrEqual(1); // 自定义 1 次重试
    });
});
