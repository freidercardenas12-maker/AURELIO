/**
 * AURELIO — Telegram Message Deduplicator & Debouncer
 * Prevents processing duplicate retries sent by Telegram API during network blips.
 */
const logger = require('./logger');

const seenMessages = new Map(); // messageId/hash -> timestamp
const TTL_MS = 10000; // 10s deduplication window

/**
 * Returns true if message has already been processed recently
 * @param {string} msgId - unique message identifier
 */
function isDuplicateMessage(msgId) {
  if (!msgId) return false;
  const now = Date.now();
  const lastSeen = seenMessages.get(msgId);

  if (lastSeen && (now - lastSeen) < TTL_MS) {
    logger.warn(`[Deduplicator] Duplicate message rejected: ${msgId}`);
    return true;
  }

  seenMessages.set(msgId, now);

  // Periodic cleanup of stale keys
  if (seenMessages.size > 500) {
    for (const [k, v] of seenMessages.entries()) {
      if (now - v > TTL_MS) seenMessages.delete(k);
    }
  }

  return false;
}

module.exports = { isDuplicateMessage };
