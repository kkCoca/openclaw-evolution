/**
 * TD-001: DuckDuckGo 搜索之盾 - Fallback 管理器
 * 
 * 版本：v2.0 (TD-001 生产就绪版)
 * 创建日期：2026-03-21
 * 关联 SPEC: tasks/20260321-duckduckgo-fallback/03_detailing/SPEC.md
 */

import { createHash, randomUUID } from 'node:crypto';

import {
  AuditEventType,
  AuditLogFields,
  ClassifiedError,
  DecisionTimeoutError,
  DdgSearchAdapter,
  FallbackConfig,
  GeminiHealthStatus,
  GeminiSearchProvider,
  HealthStatus,
  SearchProviderName,
  SearchRequest,
  SearchResponse,
  SmartSearchError,
  SmartSearchLogger,
} from './types.js';
import { classifyEmptyResponse, classifyError, createCircuitOpenClassification } from './error-classifier.js';

interface FallbackManagerOptions {
  config: FallbackConfig;
  geminiProvider: GeminiSearchProvider;
  ddgAdapter: DdgSearchAdapter;
  logger: SmartSearchLogger;
  now?: () => number;
}

interface SearchContext {
  eventId: string;       // TD-001: 新增 EventID
  requestId: string;
  queryHash: string;
  startedAt: number;
  fallbackUsed: boolean;
  geminiAttempted: boolean;
  ddgAttempted: boolean;
  attempts: {
    gemini: number;
    ddg: number;
  };
}

// ==================== 全局健康状态 (熔断器) ====================

const geminiHealthState: GeminiHealthStatus = {
  status: 'healthy',
  consecutiveFailures: 0,
  consecutiveSuccesses: 0,
};

export class FallbackManager {
  private readonly config: FallbackConfig;
  private readonly geminiProvider: GeminiSearchProvider;
  private readonly ddgAdapter: DdgSearchAdapter;
  private readonly logger: SmartSearchLogger;
  private readonly now: () => number;

  constructor(options: FallbackManagerOptions) {
    this.config = options.config;
    this.geminiProvider = options.geminiProvider;
    this.ddgAdapter = options.ddgAdapter;
    this.logger = options.logger;
    this.now = options.now ?? Date.now;
  }

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
  async executeSearch(input: SearchRequest): Promise<SearchResponse> {
    // TD-001: 生成 EventID (审计追踪)
    const context: SearchContext = {
      eventId: this.generateEventId(),
      requestId: input.requestId ?? randomUUID(),
      queryHash: this.hashQuery(input.query),
      startedAt: this.now(),
      fallbackUsed: false,
      geminiAttempted: false,
      ddgAttempted: false,
      attempts: {
        gemini: 0,
        ddg: 0,
      },
    };

    // TD-001: 记录搜索开始 (EventID 挂载)
    this.logger.info('search.request.started', this.buildLog(context, 0, undefined, undefined, 'search.request.started'));

    // TD-001: 步骤 1 - 检查熔断状态 (防死循环)
    const circuitClassification = this.getCircuitOpenClassification();
    if (circuitClassification) {
      context.fallbackUsed = true;
      this.logger.warn('search.fallback.triggered', this.buildLog(context, 0, circuitClassification, undefined, 'search.fallback.triggered'));
      return this.executeDdgFallback(input, context, circuitClassification);
    }

    // TD-001: 步骤 2 - 尝试 Gemini 搜索
    try {
      context.geminiAttempted = true;
      context.attempts.gemini += 1;
      this.logger.info('search.gemini.started', this.buildLog(context, this.now() - context.startedAt, undefined, undefined, 'search.gemini.started'));
      
      const geminiResponse = await this.executeGemini(input);

      // TD-001: 检查空响应
      if (this.config.triggerOnEmptyResponse && geminiResponse.items.length === 0) {
        const emptyClassification = classifyEmptyResponse();
        this.recordGeminiFailure();
        context.fallbackUsed = true;
        this.logger.warn('search.gemini.failed', this.buildLog(context, this.now() - context.startedAt, emptyClassification, undefined, 'search.gemini.failed'));
        this.logger.warn('search.fallback.triggered', this.buildLog(context, this.now() - context.startedAt, emptyClassification, undefined, 'search.fallback.triggered'));
        return this.executeDdgFallback(input, context, emptyClassification);
      }

      // TD-001: Gemini 成功
      this.recordGeminiSuccess();
      const result: SearchResponse = {
        provider: 'gemini',
        items: geminiResponse.items,
        tookMs: this.now() - context.startedAt,
        cached: false,
        fallbackUsed: false,
        attempts: context.attempts,
        healthStatus: geminiHealthState.status,
        eventId: context.eventId,
      };
      this.logger.info('search.gemini.succeeded', this.buildLog(context, result.tookMs, undefined, 'gemini', 'search.gemini.succeeded'));
      this.logger.info('search.completed', this.buildLog(context, result.tookMs, undefined, 'gemini', 'search.completed'));
      return result;
    } catch (error) {
      const classification = classifyError(error as Error);
      const elapsedMs = this.now() - context.startedAt;

      this.logger.warn('search.gemini.failed', this.buildLog(context, elapsedMs, classification, undefined, 'search.gemini.failed'));

      // TD-001: 步骤 3 - 错误分类，决定是否 Fallback
      if (!this.config.enabled || classification.decision === 'fatal') {
        // ⚠️ 认证/权限错误 → 直接报错，不触发 Fallback (防死循环)
        this.logger.error('search.failed_final', this.buildLog(context, elapsedMs, classification, 'gemini', 'search.failed_final', (error as Error).message));
        throw this.createFatalError(classification, context.eventId);
      }

      // TD-001: 步骤 4 - 触发 Fallback
      this.recordGeminiFailure();
      context.fallbackUsed = true;
      this.logger.warn('search.fallback.triggered', this.buildLog(context, elapsedMs, classification, undefined, 'search.fallback.triggered'));
      return this.executeDdgFallback(input, context, classification, error as Error);
    }
  }

  /**
   * 执行 Gemini 搜索 (含超时控制)
   */
  private async executeGemini(input: SearchRequest) {
    const controller = new AbortController();
    let decisionTimer: NodeJS.Timeout | undefined;
    let hardTimer: NodeJS.Timeout | undefined;

    const clearTimers = () => {
      if (decisionTimer) {
        clearTimeout(decisionTimer);
      }
      if (hardTimer) {
        clearTimeout(hardTimer);
      }
    };

    const geminiPromise = this.geminiProvider.search(input, { signal: controller.signal });
    
    // TD-001: 决策超时 (4000ms)
    const decisionTimeoutPromise = new Promise<never>((_, reject) => {
      decisionTimer = setTimeout(() => {
        controller.abort();
        reject(new DecisionTimeoutError());
      }, this.config.fallbackDecisionTimeoutMs);
    });
    
    // TD-001: 硬超时 (30000ms)
    const hardTimeoutPromise = new Promise<never>((_, reject) => {
      hardTimer = setTimeout(() => {
        controller.abort();
        reject(new Error('Gemini hard timeout exceeded.'));
      }, this.config.geminiHardTimeoutMs);
    });

    try {
      return await Promise.race([geminiPromise, decisionTimeoutPromise, hardTimeoutPromise]);
    } finally {
      clearTimers();
    }
  }

  /**
   * 执行 DDG Fallback (含重试逻辑)
   * 
   * ⚠️ 防死循环：DDG 失败后不重试 Gemini，直接抛出最终错误
   */
  private async executeDdgFallback(
    input: SearchRequest,
    context: SearchContext,
    classification: ClassifiedError,
    geminiError?: Error,
  ): Promise<SearchResponse> {
    let lastDdgError: Error | undefined;

    // TD-001: DDG 重试逻辑 (最多 maxDdgRetries 次)
    for (let attempt = 1; attempt <= this.config.maxDdgRetries; attempt += 1) {
      context.ddgAttempted = true;
      context.attempts.ddg = attempt;

      try {
        this.logger.info('search.ddg.started', this.buildLog(context, this.now() - context.startedAt, classification, undefined, 'search.ddg.started', undefined, attempt));
        
        const result = await this.ddgAdapter.search(input);
        
        const smartResult: SearchResponse = {
          provider: 'ddg',
          items: result.items,
          tookMs: this.now() - context.startedAt,
          cached: false,
          fallbackUsed: true,
          attempts: { ...context.attempts }, // 使用 context.attempts 覆盖 DDG 返回的 attempts
          healthStatus: geminiHealthState.status,
          eventId: context.eventId,
        };
        
        this.logger.info('search.ddg.succeeded', this.buildLog(context, smartResult.tookMs, classification, 'ddg', 'search.ddg.succeeded', undefined, attempt));
        this.logger.info('search.completed', this.buildLog(context, smartResult.tookMs, classification, 'ddg', 'search.completed'));
        return smartResult;
      } catch (error) {
        lastDdgError = error as Error;
        this.logger.warn('search.ddg.failed', this.buildLog(context, this.now() - context.startedAt, classification, undefined, 'search.ddg.failed', lastDdgError.message, attempt));
        
        if (attempt < this.config.maxDdgRetries) {
          this.logger.warn('search.ddg.retry', this.buildLog(context, this.now() - context.startedAt, classification, undefined, 'search.ddg.retry', lastDdgError.message, attempt));
          continue;
        }
      }
    }

    // TD-001: ⚠️ DDG 也失败 → 抛出最终错误，不重试 Gemini (防死循环)
    const finalError = new SmartSearchError('Both Gemini and DuckDuckGo search failed.', {
      reasonCode: 'unknown_error',
      primaryReasonCode: classification.reasonCode,
      fallbackTried: true,
      ddgAttempts: context.attempts.ddg,
      finalProvider: 'ddg',
      geminiMessage: geminiError instanceof Error ? geminiError.message : classification.rawMessage,
      ddgMessage: lastDdgError?.message,
      statusCode: classification.rawStatus,
      eventId: context.eventId,
    });

    this.logger.error(
      'search.failed_final',
      this.buildLog(
        context,
        this.now() - context.startedAt,
        classification,
        'ddg',
        'search.failed_final',
        lastDdgError?.message ?? finalError.message,
        context.attempts.ddg,
      ),
    );

    throw finalError;
  }

  /**
   * 创建致命错误 (不触发 Fallback)
   */
  private createFatalError(classification: ClassifiedError, eventId: string): SmartSearchError {
    return new SmartSearchError(classification.rawMessage, {
      reasonCode: classification.reasonCode,
      primaryReasonCode: classification.reasonCode,
      fallbackTried: false,
      ddgAttempts: 0,
      finalProvider: 'gemini',
      statusCode: classification.rawStatus,
      eventId,
    });
  }

  /**
   * 获取熔断状态分类
   * 
   * TD-001: 熔断期间直接返回分类，跳过 Gemini 尝试 (防死循环)
   */
  private getCircuitOpenClassification(): ClassifiedError | undefined {
    const now = this.now();
    
    // 检查是否在熔断期间
    if (geminiHealthState.status === 'unhealthy' && geminiHealthState.nextRetryAt && now < geminiHealthState.nextRetryAt) {
      return createCircuitOpenClassification();
    }

    // 检查是否到了恢复时间
    if (geminiHealthState.status === 'unhealthy' && geminiHealthState.nextRetryAt && now >= geminiHealthState.nextRetryAt) {
      geminiHealthState.status = 'degraded';
      geminiHealthState.consecutiveSuccesses = 0;
      this.logger.warn('health.recovery.attempted', this.buildHealthLog('health.recovery.attempted'));
    }

    return undefined;
  }

  /**
   * 记录 Gemini 失败
   * 
   * TD-001: 连续失败≥3 次触发熔断
   */
  private recordGeminiFailure(): void {
    const now = this.now();
    const previousStatus = geminiHealthState.status;
    
    geminiHealthState.lastFailureAt = now;
    geminiHealthState.consecutiveFailures += 1;
    geminiHealthState.consecutiveSuccesses = 0;

    if (
      geminiHealthState.status === 'degraded' ||
      geminiHealthState.consecutiveFailures >= this.config.healthCheck.failureThreshold
    ) {
      geminiHealthState.status = 'unhealthy';
      geminiHealthState.nextRetryAt = now + this.config.healthCheck.circuitBreakerTimeoutMs;
      this.logger.warn('health.circuit.opened', this.buildHealthLog('health.circuit.opened'));
    }

    // 记录状态变更
    if (previousStatus !== geminiHealthState.status) {
      this.logger.warn('health.status.changed', this.buildHealthLog('health.status.changed'));
    }
  }

  /**
   * 记录 Gemini 成功
   * 
   * TD-001: 连续成功≥2 次恢复健康状态
   */
  private recordGeminiSuccess(): void {
    const now = this.now();
    const previousStatus = geminiHealthState.status;
    
    geminiHealthState.lastSuccessAt = now;
    geminiHealthState.consecutiveFailures = 0;

    if (geminiHealthState.status === 'degraded') {
      geminiHealthState.consecutiveSuccesses += 1;
      if (geminiHealthState.consecutiveSuccesses >= this.config.healthCheck.recoveryThreshold) {
        geminiHealthState.status = 'healthy';
        geminiHealthState.nextRetryAt = undefined;
        geminiHealthState.consecutiveSuccesses = 0;
        this.logger.info('health.circuit.closed', this.buildHealthLog('health.circuit.closed'));
      }
    }

    // 记录状态变更
    if (previousStatus !== geminiHealthState.status) {
      this.logger.info('health.status.changed', this.buildHealthLog('health.status.changed'));
    }
  }

  /**
   * 构建审计日志字段 (EventID 挂载)
   */
  private buildLog(
    context: SearchContext,
    elapsedMs: number,
    classification?: ClassifiedError,
    finalProvider?: SearchProviderName,
    eventType: AuditEventType = 'search.request.started',
    errorMessage?: string,
    retryCount = Math.max(0, context.attempts.ddg - 1),
  ): AuditLogFields {
    return {
      eventId: context.eventId,
      requestId: context.requestId,
      queryHash: context.queryHash,
      eventType,
      timestamp: new Date(this.now()).toISOString(),
      elapsedMs,
      finalProvider,
      fallbackUsed: context.fallbackUsed,
      geminiAttempted: context.geminiAttempted,
      ddgAttempted: context.ddgAttempted,
      retryCount,
      reasonCode: classification?.reasonCode,
      errorMessage: errorMessage ?? classification?.rawMessage,
      healthStatus: geminiHealthState.status,
    };
  }

  /**
   * 构建健康状态日志
   */
  private buildHealthLog(eventType: AuditEventType): AuditLogFields {
    return {
      eventId: this.generateEventId(),
      requestId: 'health-monitor',
      queryHash: 'health',
      eventType,
      timestamp: new Date(this.now()).toISOString(),
      elapsedMs: 0,
      fallbackUsed: false,
      geminiAttempted: false,
      ddgAttempted: false,
      retryCount: 0,
      healthStatus: geminiHealthState.status,
    };
  }

  /**
   * 生成 EventID (审计追踪)
   * 格式：{timestamp}-{uuid}
   */
  private generateEventId(): string {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const uuid = randomUUID();
    return `${timestamp}-${uuid}`;
  }

  /**
   * 生成查询哈希 (隐私保护)
   */
  private hashQuery(query: string): string {
    return createHash('sha256').update(query).digest('hex').slice(0, 16);
  }
}

/**
 * 获取 Gemini 健康状态
 */
export function getGeminiHealthStatus(): GeminiHealthStatus {
  return { ...geminiHealthState };
}

/**
 * 重置 Gemini 健康状态 (测试用)
 */
export function resetGeminiHealthStatus(): void {
  geminiHealthState.status = 'healthy';
  geminiHealthState.lastFailureAt = undefined;
  geminiHealthState.lastSuccessAt = undefined;
  geminiHealthState.nextRetryAt = undefined;
  geminiHealthState.consecutiveFailures = 0;
  geminiHealthState.consecutiveSuccesses = 0;
}
