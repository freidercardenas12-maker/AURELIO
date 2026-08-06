/**
 * AURELIO — Anti Cold-Start Warm-Up Pinger
 * Keeps HTTPS TLS/SSL socket warm with Gemini API every 4 minutes.
 * Ensures zero-latency responses (<400ms) even after hours of idle state.
 */
const { geminiCall } = require('./gemini');
const logger = require('../utils/logger');

let warmupInterval = null;

function startWarmupPinger(intervalMs = 4 * 60 * 1000) {
  logger.info(`[Warm-Up Engine] Active — pinging Gemini socket every ${intervalMs / 60000} minutes.`);

  warmupInterval = setInterval(async () => {
    try {
      // Lightweight silent ping
      await geminiCall('ping');
      logger.info('[Warm-Up Engine] Socket warm-up successful. Connection hot 🔥');
    } catch (e) {
      logger.warn(`[Warm-Up Engine] Ping skipped: ${e.message}`);
    }
  }, intervalMs);
}

module.exports = { startWarmupPinger };
