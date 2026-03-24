class AntiBotGuard {
  constructor(config, options = {}) {
    this.config = config;
    this.nowFn = options.nowFn || Date.now;
    this.randomFn = options.randomFn || Math.random;
    this.sleepFn = options.sleepFn || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.failureState = {
      ddg: { consecutiveFailures: 0, backoffUntil: 0 },
      bing: { consecutiveFailures: 0, backoffUntil: 0 },
    };
  }

  async beforeRequest(source) {
    const state = this.failureState[source];
    const now = this.nowFn();
    const jitterDelay = this.calculateJitterDelay();
    const backoffDelay = state.backoffUntil > now ? state.backoffUntil - now : 0;
    const waitMs = Math.max(jitterDelay, backoffDelay);

    if (waitMs > 0) {
      await this.sleepFn(waitMs);
    }

    return {
      headers: this.createBrowserHeaders(source),
      delayMs: waitMs,
      backoffUntil: state.backoffUntil || undefined,
    };
  }

  recordFailure(source) {
    const state = this.failureState[source];
    state.consecutiveFailures += 1;
    if (state.consecutiveFailures >= 2) {
      state.backoffUntil = this.nowFn() + state.consecutiveFailures * this.config.backoffBaseMs;
    }
  }

  recordSuccess(source) {
    this.failureState[source] = {
      consecutiveFailures: 0,
      backoffUntil: 0,
    };
  }

  createBrowserHeaders(source) {
    return {
      ...this.config.defaultHeaders,
      referer: source === 'bing' ? 'https://www.bing.com/' : this.config.defaultHeaders.referer,
    };
  }

  calculateJitterDelay() {
    const span = this.config.jitterMaxMs - this.config.jitterMinMs;
    if (span <= 0) {
      return this.config.jitterMinMs;
    }

    return this.config.jitterMinMs + Math.round(this.randomFn() * span);
  }
}

module.exports = {
  AntiBotGuard,
};
