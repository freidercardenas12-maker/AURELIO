/**
 * AURELIO — Circuit Breaker Pattern Engine
 * Protects system from frozen external APIs by opening state on repeated failures.
 * States: CLOSED (normal), OPEN (broken API, fast fallback), HALF-OPEN (testing recovery).
 */
const logger = require('./logger');

class CircuitBreaker {
  constructor(name, opts = {}) {
    this.name = name;
    this.failureThreshold = opts.failureThreshold || 3;
    this.cooldownMs = opts.cooldownMs || 60000; // 60s cooldown when open
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(asyncFn, fallbackFn) {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        this.state = 'HALF-OPEN';
        logger.info(`[Circuit Breaker: ${this.name}] Entering HALF-OPEN state (testing API recovery)...`);
      } else {
        logger.warn(`[Circuit Breaker: ${this.name}] OPEN state active — executing fallback immediately.`);
        return fallbackFn ? fallbackFn() : null;
      }
    }

    try {
      const result = await asyncFn();
      if (this.state === 'HALF-OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        logger.info(`[Circuit Breaker: ${this.name}] Recovered! State reset to CLOSED.`);
      }
      return result;
    } catch (err) {
      this.failureCount++;
      logger.error(`[Circuit Breaker: ${this.name}] Failure ${this.failureCount}/${this.failureThreshold}: ${err.message}`);

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = now + this.cooldownMs;
        logger.error(`[Circuit Breaker: ${this.name}] Threshold reached! Circuit OPEN for ${this.cooldownMs / 1000}s.`);
      }

      return fallbackFn ? fallbackFn() : null;
    }
  }

  getStatus() {
    return { name: this.name, state: this.state, failures: this.failureCount };
  }
}

module.exports = CircuitBreaker;
