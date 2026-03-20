import type { RateLimitControllerOptions } from './types.js';
export declare class RateLimitController {
    private readonly minIntervalMs;
    private readonly failureBackoffMs;
    private readonly maxBackoffMs;
    private readonly now;
    private readonly sleep;
    private lastRequestStartedAt;
    private adaptiveDelayMs;
    constructor(options?: RateLimitControllerOptions);
    beforeRequest(): Promise<void>;
    afterSuccess(): void;
    afterFailure(): void;
}
