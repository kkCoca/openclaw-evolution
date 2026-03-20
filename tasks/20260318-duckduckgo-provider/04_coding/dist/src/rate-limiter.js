const DEFAULT_MIN_INTERVAL_MS = 1_000;
const DEFAULT_FAILURE_BACKOFF_MS = 250;
const DEFAULT_MAX_BACKOFF_MS = 5_000;
export class RateLimitController {
    minIntervalMs;
    failureBackoffMs;
    maxBackoffMs;
    now;
    sleep;
    lastRequestStartedAt = null;
    adaptiveDelayMs = 0;
    constructor(options = {}) {
        this.minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
        this.failureBackoffMs = options.failureBackoffMs ?? DEFAULT_FAILURE_BACKOFF_MS;
        this.maxBackoffMs = options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS;
        this.now = options.now ?? Date.now;
        this.sleep = options.sleep ?? defaultSleep;
    }
    async beforeRequest() {
        const currentTime = this.now();
        const waitForInterval = this.lastRequestStartedAt === null
            ? 0
            : Math.max(0, this.minIntervalMs - (currentTime - this.lastRequestStartedAt));
        const waitForAdaptiveDelay = this.lastRequestStartedAt === null ? this.adaptiveDelayMs : 0;
        const waitMs = Math.max(waitForInterval, waitForAdaptiveDelay);
        if (waitMs > 0) {
            await this.sleep(waitMs);
        }
        this.lastRequestStartedAt = this.now();
    }
    afterSuccess() {
        this.adaptiveDelayMs = Math.max(0, this.adaptiveDelayMs - this.failureBackoffMs);
    }
    afterFailure() {
        this.adaptiveDelayMs = Math.min(this.maxBackoffMs, this.adaptiveDelayMs + this.failureBackoffMs);
    }
}
async function defaultSleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
