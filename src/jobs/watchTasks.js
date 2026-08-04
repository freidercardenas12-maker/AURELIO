const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel } = require('../utils/notion-props');
const logger = require('../utils/logger');

let taskCache = {};
let isFirstRun = true;

async function watchTasks() {
  try {
    const tasks = await queryDB(config.TASKS_DB_ID);
    const current = {};

    for (const t of tasks) {
      const id = t.id;
      const title = txt(t.properties?.['Tarea']) || 'Sin título';
      const status = sel(t.properties?.['Estado']) || 'Sin estado';
      current[id] = { title, status };

      if (!isFirstRun && taskCache[id] && taskCache[id].status !== status) {
        logger.info(`[Watch Tasks] Task updated: "${title}" (${taskCache[id].status} -> ${status})`);
        await sendMsg(`🔔 *Tarea Actualizada*\n\n📌 *${title}*\n🔄 \`${taskCache[id].status}\` ➔ *${status}*`);
      }
    }

    taskCache = current;
    isFirstRun = false;
  } catch (e) {
    logger.error(`[Watch Tasks Error]: ${e.message}`);
  }
}

module.exports = { watchTasks };
