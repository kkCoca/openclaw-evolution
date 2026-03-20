import { createHash, randomUUID } from 'node:crypto';
import { DecisionTimeoutError, SmartSearchError, } from './types.js';
import { classifyEmptyResponse, classifyError, createCircuitOpenClassification } from './error-classifier.js';
const geminiHealthState = {
    status: 'healthy',
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
};
export class FallbackManager {
    config;
    geminiProvider;
    ddgAdapter;
    logger;
    now;
    constructor(options) {
        this.config = options.config;
        this.geminiProvider = options.geminiProvider;
        this.ddgAdapter = options.ddgAdapter;
        this.logger = options.logger;
        this.now = options.now ?? Date.now;
    }
    async executeSearch(input) {
        const context = {
            requestId: input.requestId ?? randomUUID(),
            queryHash: hashQuery(input.query),
            startedAt: this.now(),
            fallbackUsed: false,
            geminiAttempted: false,
            ddgAttempted: false,
            attempts: {
                gemini: 0,
                ddg: 0,
            },
        };
        this.logger.info('search.request.started', this.buildLog(context, 0));
        const circuitClassification = this.getCircuitOpenClassification();
        if (circuitClassification) {
            context.fallbackUsed = true;
            this.logger.warn('search.fallback.triggered', this.buildLog(context, 0, circuitClassification));
            return this.executeDdgFallback(input, context, circuitClassification);
        }
        try {
            context.geminiAttempted = true;
            context.attempts.gemini += 1;
            const geminiResponse = await this.executeGemini(input);
            if (this.config.triggerOnEmptyResponse && geminiResponse.items.length === 0) {
                const emptyClassification = classifyEmptyResponse();
                this.recordGeminiFailure();
                context.fallbackUsed = true;
                this.logger.warn('search.gemini.failed', this.buildLog(context, this.now() - context.startedAt, emptyClassification));
                this.logger.warn('search.fallback.triggered', this.buildLog(context, this.now() - context.startedAt, emptyClassification));
                return this.executeDdgFallback(input, context, emptyClassification);
            }
            this.recordGeminiSuccess();
            const result = {
                provider: 'gemini',
                items: geminiResponse.items,
                fallbackUsed: false,
                timingMs: this.now() - context.startedAt,
                attempts: context.attempts,
            };
            this.logger.info('search.gemini.succeeded', this.buildLog(context, result.timingMs, undefined, 'gemini'));
            return result;
        }
        catch (error) {
            const classification = classifyError(error);
            const elapsedMs = this.now() - context.startedAt;
            this.logger.warn('search.gemini.failed', this.buildLog(context, elapsedMs, classification));
            if (!this.config.enabled || classification.decision === 'fatal') {
                throw this.createFatalError(classification);
            }
            this.recordGeminiFailure();
            context.fallbackUsed = true;
            this.logger.warn('search.fallback.triggered', this.buildLog(context, elapsedMs, classification));
            return this.executeDdgFallback(input, context, classification, error);
        }
    }
    async executeGemini(input) {
        const controller = new AbortController();
        let decisionTimer;
        let hardTimer;
        const clearTimers = () => {
            if (decisionTimer) {
                clearTimeout(decisionTimer);
            }
            if (hardTimer) {
                clearTimeout(hardTimer);
            }
        };
        const geminiPromise = this.geminiProvider.search(input, { signal: controller.signal });
        const decisionTimeoutPromise = new Promise((_, reject) => {
            decisionTimer = setTimeout(() => {
                controller.abort();
                reject(new DecisionTimeoutError());
            }, this.config.fallbackDecisionTimeoutMs);
        });
        const hardTimeoutPromise = new Promise((_, reject) => {
            hardTimer = setTimeout(() => {
                controller.abort();
                reject(new Error('Gemini hard timeout exceeded.'));
            }, this.config.geminiHardTimeoutMs);
        });
        try {
            return await Promise.race([geminiPromise, decisionTimeoutPromise, hardTimeoutPromise]);
        }
        finally {
            clearTimers();
        }
    }
    async executeDdgFallback(input, context, classification, geminiError) {
        let lastDdgError;
        for (let attempt = 1; attempt <= this.config.maxDdgRetries; attempt += 1) {
            context.ddgAttempted = true;
            context.attempts.ddg = attempt;
            try {
                const result = await this.ddgAdapter.search(input);
                const smartResult = {
                    ...result,
                    fallbackUsed: true,
                    timingMs: this.now() - context.startedAt,
                    attempts: {
                        gemini: context.attempts.gemini,
                        ddg: attempt,
                    },
                };
                this.logger.info('search.ddg.succeeded', this.buildLog(context, smartResult.timingMs, classification, 'ddg'));
                return smartResult;
            }
            catch (error) {
                lastDdgError = error;
                if (attempt < this.config.maxDdgRetries) {
                    this.logger.warn('search.ddg.retry', this.buildLog(context, this.now() - context.startedAt, classification, undefined, attempt, lastDdgError.message));
                    continue;
                }
            }
        }
        const finalError = new SmartSearchError('Both Gemini and DuckDuckGo search failed.', {
            reasonCode: 'unknown_error',
            primaryReasonCode: classification.reasonCode,
            fallbackTried: true,
            ddgAttempts: context.attempts.ddg,
            finalProvider: 'ddg',
            geminiMessage: geminiError instanceof Error ? geminiError.message : classification.rawMessage,
            ddgMessage: lastDdgError?.message,
            statusCode: classification.rawStatus,
        });
        this.logger.error('search.search.failed_final', this.buildLog(context, this.now() - context.startedAt, classification, 'ddg', context.attempts.ddg, lastDdgError?.message ?? finalError.message));
        throw finalError;
    }
    createFatalError(classification) {
        return new SmartSearchError(classification.rawMessage, {
            reasonCode: classification.reasonCode,
            primaryReasonCode: classification.reasonCode,
            fallbackTried: false,
            ddgAttempts: 0,
            finalProvider: 'gemini',
            statusCode: classification.rawStatus,
        });
    }
    getCircuitOpenClassification() {
        const now = this.now();
        if (geminiHealthState.status === 'unhealthy' && geminiHealthState.nextRetryAt && now < geminiHealthState.nextRetryAt) {
            return createCircuitOpenClassification();
        }
        if (geminiHealthState.status === 'unhealthy' && geminiHealthState.nextRetryAt && now >= geminiHealthState.nextRetryAt) {
            geminiHealthState.status = 'degraded';
            geminiHealthState.consecutiveSuccesses = 0;
        }
        return undefined;
    }
    recordGeminiFailure() {
        const now = this.now();
        geminiHealthState.lastFailureAt = now;
        geminiHealthState.consecutiveFailures += 1;
        geminiHealthState.consecutiveSuccesses = 0;
        if (geminiHealthState.status === 'degraded' ||
            geminiHealthState.consecutiveFailures >= this.config.healthCheck.failureThreshold) {
            geminiHealthState.status = 'unhealthy';
            geminiHealthState.nextRetryAt = now + this.config.healthCheck.circuitBreakerTimeoutMs;
        }
    }
    recordGeminiSuccess() {
        const now = this.now();
        geminiHealthState.lastSuccessAt = now;
        geminiHealthState.consecutiveFailures = 0;
        if (geminiHealthState.status === 'degraded') {
            geminiHealthState.consecutiveSuccesses += 1;
            if (geminiHealthState.consecutiveSuccesses >= this.config.healthCheck.recoveryThreshold) {
                geminiHealthState.status = 'healthy';
                geminiHealthState.nextRetryAt = undefined;
                geminiHealthState.consecutiveSuccesses = 0;
            }
            return;
        }
        geminiHealthState.status = 'healthy';
        geminiHealthState.nextRetryAt = undefined;
        geminiHealthState.consecutiveSuccesses = 0;
    }
    buildLog(context, elapsedMs, classification, finalProvider, retryCount = Math.max(0, context.attempts.ddg - 1), errorMessage) {
        return {
            requestId: context.requestId,
            queryHash: context.queryHash,
            reasonCode: classification?.reasonCode,
            occurredAt: new Date(this.now()).toISOString(),
            elapsedMs,
            retryCount,
            finalProvider,
            fallbackUsed: context.fallbackUsed,
            geminiAttempted: context.geminiAttempted,
            ddgAttempted: context.ddgAttempted,
            errorMessage: errorMessage ?? classification?.rawMessage,
        };
    }
}
export function getGeminiHealthStatus() {
    return { ...geminiHealthState };
}
export function resetGeminiHealthStatus() {
    geminiHealthState.status = 'healthy';
    geminiHealthState.lastFailureAt = undefined;
    geminiHealthState.lastSuccessAt = undefined;
    geminiHealthState.nextRetryAt = undefined;
    geminiHealthState.consecutiveFailures = 0;
    geminiHealthState.consecutiveSuccesses = 0;
}
function hashQuery(query) {
    return createHash('sha256').update(query).digest('hex').slice(0, 16);
}
