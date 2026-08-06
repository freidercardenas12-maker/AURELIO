/**
 * AURELIO — Retry Wrapper with Exponential Backoff
 * Wraps any async function with intelligent retry logic.
 * Used for Notion API, Telegram API, and Gemini calls.
 */
const logger = require('./logger');

/**
 * Retry an async function with exponential backoff.
 * @param {Function} fn - the async function to execute
 * @param {Object} opts - { retries, baseDelayMs, label }
 */
async function withRetry(fn, { retries = 3, baseDelayMs = 500, label = 'Operation' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === retries;
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 500ms, 1000ms, 2000ms

      if (isLastAttempt) {
        logger.error(`[${label}] Failed after ${retries} attempts: ${err.message}`);
      } else {
        logger.warn(`[${label}] Attempt ${attempt}/${retries} failed. Retrying in ${delay}ms... (${err.message})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Execute multiple async operations in parallel with a timeout.
 * Returns results array. Failed items return null (never throws).
 * @param {Array<Function>} fns - array of async functions
 * @param {number} timeoutMs - timeout per operation
 */
async function parallelSafe(fns, timeoutMs = 8000) {
  return Promise.all(
    fns.map(fn =>
      Promise.race([
        fn().catch(e => { logger.warn(`[Parallel] Task failed: ${e.message}`); return null; }),
        new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
      ])
    )
  );
}

module.exports = { withRetry, parallelSafe };
