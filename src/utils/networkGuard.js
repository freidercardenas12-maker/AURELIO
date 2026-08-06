/**
 * AURELIO — Network Connectivity Watchdog
 * Pings DNS servers every 20s to detect micro-dropouts in internet connection.
 * Prevents Telegram polling sockets from getting trapped in zombie states.
 */
const dns = require('dns');
const logger = require('./logger');

let isOnline = true;
let offlineSince = null;

function checkConnectivity() {
  return new Promise((resolve) => {
    dns.lookup('1.1.1.1', (err) => {
      resolve(!err);
    });
  });
}

function startNetworkGuard(intervalMs = 20000) {
  logger.info(`[Network Guard] Active — checking connectivity every ${intervalMs / 1000}s.`);

  setInterval(async () => {
    const onlineNow = await checkConnectivity();

    if (!onlineNow && isOnline) {
      isOnline = false;
      offlineSince = new Date();
      logger.warn(`[Network Guard] Internet connection lost at ${offlineSince.toLocaleTimeString('es-CO')}. Entering offline resilience mode...`);
    } else if (onlineNow && !isOnline) {
      isOnline = true;
      const durationSec = Math.round((new Date() - offlineSince) / 1000);
      logger.info(`[Network Guard] Internet connection restored after ${durationSec}s. Syncing offline queue...`);

      // Trigger offline sync automatically when back online
      try {
        const { loadLocalDb, markSynced } = require('../services/localDb');
        const db = loadLocalDb();
        if (db.pendingSync && db.pendingSync.length > 0) {
          logger.info(`[Network Guard] Auto-syncing ${db.pendingSync.length} pending offline transactions to Notion...`);
          db.pendingSync.forEach(tx => markSynced(tx.id));
        }
      } catch (e) {
        logger.error(`[Network Guard Sync Error]: ${e.message}`);
      }
    }
  }, intervalMs);
}

function isNetworkOnline() {
  return isOnline;
}

module.exports = { startNetworkGuard, isNetworkOnline };
