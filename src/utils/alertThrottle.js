/**
 * AURELIO — Smart Notification Throttle Guard
 * Prevents spamming the same proactive alert more than once per hour.
 * Works in-memory (resets on restart) — keeps Aurelio's voice alerts clean.
 */

const sentAlerts = new Map(); // key: alertKey -> timestamp last sent

/**
 * Returns true if this alert should be sent (hasn't been sent recently)
 * @param {string} alertKey - unique identifier for this alert (e.g., meeting title + date)
 * @param {number} cooldownMs - cooldown in milliseconds (default: 1 hour)
 */
function shouldSendAlert(alertKey, cooldownMs = 60 * 60 * 1000) {
  const now = Date.now();
  const lastSent = sentAlerts.get(alertKey);
  if (lastSent && (now - lastSent) < cooldownMs) {
    return false; // already sent recently, skip
  }
  sentAlerts.set(alertKey, now);
  return true;
}

/**
 * Clear all throttle state (call on fresh day)
 */
function clearThrottleState() {
  sentAlerts.clear();
}

module.exports = { shouldSendAlert, clearThrottleState };
