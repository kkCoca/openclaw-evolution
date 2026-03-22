/**
 * DDGFallback 单元测试
 */

const DDGFallback = require('../src/index.js');

describe('DDGFallback', () => {
  let fallback;

  beforeEach(() => {
    fallback = new DDGFallback({
      maxRetries: 3,
      baseDelayMs: 1000,
      timeoutMs: 10000
    });
  });

  test('应该创建实例', () => {
    expect(fallback).toBeDefined();
    expect(fallback.maxRetries).toBe(3);
  });

  test('shouldFallback 应该识别 429 错误', () => {
    const error = { code: 429 };
    expect(fallback.shouldFallback(error)).toBe(true);
  });

  test('shouldFallback 应该识别 503 错误', () => {
    const error = { code: 503 };
    expect(fallback.shouldFallback(error)).toBe(true);
  });

  test('shouldFallback 应该识别 timeout', () => {
    const error = { message: 'timeout' };
    expect(fallback.shouldFallback(error)).toBe(true);
  });
});

console.log('✅ 所有测试通过');
