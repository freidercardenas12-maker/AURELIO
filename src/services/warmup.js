/**
 * AURELIO — Anti Cold-Start Warm-Up Pinger (Quota Safe)
 * Performs a zero-token socket ping to Google APIs every 15 minutes.
 * Keeps TLS/SSL sockets hot without wasting Gemini API free quota.
 */
const https = require('https');
const logger = require('../utils/logger');

function startWarmupPinger(intervalMs = 15 * 60 * 1000) {
  logger.info(`[Warm-Up Engine] Active — maintaining TLS socket every ${intervalMs / 60000} minutes.`);

  setInterval(() => {
    try {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: '/',
        method: 'HEAD',
        timeout: 3000
      }, (res) => {
        logger.info('[Warm-Up Engine] Socket warm-up successful. TLS connection hot 🔥');
      });
      req.on('error', () => {});
      req.end();
    } catch (e) {
      // Ignore transient errors
    }
  }, intervalMs);
}

module.exports = { startWarmupPinger };
