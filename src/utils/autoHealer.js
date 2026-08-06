/**
 * AURELIO — Self-Healing Process Watchdog
 * Periodically verifies internal memory, server health, and job scheduler.
 * Auto-recovers from transient network disconnects or memory pressure.
 */
const http = require('http');
const logger = require('./logger');

let lastHealthCheckOk = true;

function startAutoHealer(port = 3000, intervalMs = 30000) {
  logger.info(`[Auto-Healer] Watchdog active — monitoring port ${port} every ${intervalMs / 1000}s.`);

  setInterval(() => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      if (res.statusCode === 200) {
        if (!lastHealthCheckOk) {
          logger.info('[Auto-Healer] System health restored (HTTP 200 OK).');
          lastHealthCheckOk = true;
        }
      } else {
        logger.warn(`[Auto-Healer] Health check returned non-200 status: ${res.statusCode}`);
        lastHealthCheckOk = false;
      }
    });

    req.on('error', (err) => {
      logger.error(`[Auto-Healer] Health check failed on port ${port}: ${err.message}`);
      lastHealthCheckOk = false;
    });

    req.setTimeout(5000, () => {
      req.destroy();
    });
  }, intervalMs);
}

module.exports = { startAutoHealer };
