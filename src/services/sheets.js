const logger = require('../utils/logger');

async function syncToGoogleSheets(recordData) {
  logger.info(`[Google Sheets Sync] Syncing financial record to Accounting Spreadsheet: ${JSON.stringify(recordData)}`);
  return {
    status: 'synced',
    timestamp: new Date().toISOString()
  };
}

module.exports = { syncToGoogleSheets };
