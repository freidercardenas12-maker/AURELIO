/**
 * AURELIO — In-Memory Notion Query Cache
 * Caches Notion DB results for TTL ms to avoid redundant API calls.
 * Makes repeated queries (same DB within 5 min) instantaneous (0ms).
 */

const cache = new Map(); // key: dbId -> { data, expiresAt }

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached result or fetch fresh data
 * @param {string} key - cache key (usually dbId)
 * @param {Function} fetchFn - async function to call on cache miss
 * @param {number} ttlMs - time-to-live in ms
 */
async function cachedQuery(key, fetchFn, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const hit = cache.get(key);

  if (hit && hit.expiresAt > now) {
    return hit.data; // ⚡ Cache hit — instant return
  }

  const data = await fetchFn(); // 🌐 Cache miss — fetch fresh
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * Invalidate a specific cache key (call after writes)
 */
function invalidate(key) {
  cache.delete(key);
}

/**
 * Invalidate all cached entries
 */
function invalidateAll() {
  cache.clear();
}

/**
 * Cache stats for /status command
 */
function getCacheStats() {
  const now = Date.now();
  const entries = [...cache.entries()];
  const active = entries.filter(([, v]) => v.expiresAt > now).length;
  return { total: cache.size, active, stale: cache.size - active };
}

module.exports = { cachedQuery, invalidate, invalidateAll, getCacheStats };
