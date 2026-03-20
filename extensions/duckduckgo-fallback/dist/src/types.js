export class SmartSearchError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.name = 'SmartSearchError';
        this.details = details;
    }
}
export class DecisionTimeoutError extends Error {
    constructor(message = 'Gemini fallback decision timeout exceeded.') {
        super(message);
        this.name = 'DecisionTimeoutError';
    }
}
export const DEFAULT_DDG_PROVIDER_ENTRY = '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';
export const DEFAULT_FALLBACK_CONFIG = {
    enabled: true,
    maxDdgRetries: 3,
    fallbackDecisionTimeoutMs: 4500,
    geminiHardTimeoutMs: 30000,
    ddgTimeoutMs: 12000,
    triggerOnEmptyResponse: true,
    ddgProviderEntry: DEFAULT_DDG_PROVIDER_ENTRY,
    healthCheck: {
        failureThreshold: 3,
        circuitBreakerTimeoutMs: 5 * 60 * 1000,
        recoveryThreshold: 2,
    },
};
