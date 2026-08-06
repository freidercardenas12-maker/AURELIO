const { morningBriefing } = require('./morningBriefing');
const { middayCheck } = require('./middayCheck');
const { eveningReview } = require('./eveningReview');
const { watchTasks } = require('./watchTasks');
const { watchAgendaMeetings } = require('./watchAgenda');
const { syncCRM } = require('./syncCRM');
const { runCRMReactivationAgent } = require('../services/crm_agent');
const { updateLivePinnedBoard } = require('./pinnedBoard');
const { runPriceRadar } = require('./priceRadar');
const { updateNotionMirror } = require('../services/notionMirror');
const { getColombiaHour, getTodayStr } = require('../utils/dates');
const logger = require('../utils/logger');

let notifiedToday = { morning: false, midday: false, evening: false };
let lastNotifDate = '';

function scheduleNotifications() {
  setInterval(async () => {
    const todayStr = getTodayStr();
    const hour = getColombiaHour();

    if (lastNotifDate !== todayStr) {
      notifiedToday = { morning: false, midday: false, evening: false };
      lastNotifDate = todayStr;
    }

    if (hour === 7 && !notifiedToday.morning) {
      notifiedToday.morning = true;
      await morningBriefing();
    }

    if (hour === 12 && !notifiedToday.midday) {
      notifiedToday.midday = true;
      await middayCheck();
    }

    if (hour === 20 && !notifiedToday.evening) {
      notifiedToday.evening = true;
      await eveningReview();
    }
  }, 60 * 1000);
}

function startJobs() {
  logger.info('[Scheduler] Starting background jobs...');

  // Initial runs
  watchTasks();
  watchAgendaMeetings();
  setTimeout(syncCRM, 5000);
  setTimeout(runCRMReactivationAgent, 10000);
  setTimeout(updateLivePinnedBoard, 15000);

  // Intervals
  setInterval(watchTasks, 30000);
  setInterval(watchAgendaMeetings, 5 * 60 * 1000);
  setInterval(updateLivePinnedBoard, 10 * 60 * 1000);
  setInterval(syncCRM, 12 * 60 * 60 * 1000);
  setInterval(runCRMReactivationAgent, 24 * 60 * 60 * 1000);
  setInterval(runPriceRadar, 30 * 60 * 1000); // Price Radar every 30 min
  setInterval(updateNotionMirror, 10 * 60 * 1000); // Notion Mirror every 10 min

  // Minute ticker for proactive scheduled notifications
  scheduleNotifications();

  logger.info('✅ [Scheduler] All background jobs and monitors active.');
}

module.exports = {
  startJobs,
  morningBriefing,
  middayCheck,
  eveningReview,
  watchTasks,
  watchAgendaMeetings,
  syncCRM
};
