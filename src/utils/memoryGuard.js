/**
 * AURELIO — RAM Memory Heap Watchdog
 * Monitors Node.js heap memory usage. Triggers garbage collection / cache purges
 * if RAM exceeds 150 MB, keeping Aurelio fast and lightweight indefinitely.
 */
const { invalidateAll } = require('./notionCache');
const logger = require('./logger');

const MAX_HEAP_MB = 150;

function startMemoryGuard(intervalMs = 60000) {
  logger.info(`[Memory Guard] Active — monitoring RAM heap every ${intervalMs / 1000}s (Max threshold: ${MAX_HEAP_MB} MB).`);

  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMb = Math.round(memUsage.heapUsed / (1024 * 1024));

    if (heapUsedMb > MAX_HEAP_MB) {
      logger.warn(`[Memory Guard] Heap memory high (${heapUsedMb} MB / ${MAX_HEAP_MB} MB). Triggering cache purge...`);
      invalidateAll();

      if (global.gc) {
        try {
          global.gc();
          logger.info('[Memory Guard] V8 Garbage Collection executed.');
        } catch (e) {
          logger.warn(`[Memory Guard GC Warning]: ${e.message}`);
        }
      }
    }
  }, intervalMs);
}

module.exports = { startMemoryGuard };
