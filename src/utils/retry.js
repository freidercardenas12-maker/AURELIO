const logger = require('./logger');

/**
 * Executes an async function with exponential backoff retry.
 * @param {Function} fn Async function to execute.
 * @param {number} retries Maximum number of attempts.
 * @param {number} delay Initial delay in milliseconds.
 * @returns {Promise<any>}
 */
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        logger.error(`[Retry Exceeded] Failed after ${retries} attempts: ${error.message}`);
        throw error;
      }
      const waitTime = delay * Math.pow(2, attempt - 1);
      logger.warn(`[Retry Attempt ${attempt}/${retries}] Failed: ${error.message}. Retrying in ${waitTime}ms...`);
      await new Promise(res => setTimeout(res, waitTime));
    }
  }
}

module.exports = { withRetry };
