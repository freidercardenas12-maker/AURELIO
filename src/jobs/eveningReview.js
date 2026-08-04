const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel } = require('../utils/notion-props');
const { getTodayStr, getTomorrowStr } = require('../utils/dates');
const logger = require('../utils/logger');

async function eveningReview() {
  logger.info('[Job] Running Evening Review (8:00 PM)...');
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();

  const tasks = await queryDB(config.TASKS_DB_ID);
  const completedToday = tasks.filter(t => sel(t.properties?.['Estado']) === 'Done');
  const pendingTomorrow = tasks.filter(t => {
    const st = sel(t.properties?.['Estado']);
    const date = t.properties?.['Fecha de Entrega']?.date?.start;
    return (st === 'To Do' || st === 'In Progress') && date === tomorrow;
  });

  let msg = `🌙 *Revisión Nocturna — Aurelio*\n\n`;
  msg += `✅ *Completadas hoy:* ${completedToday.length} tareas\n`;

  if (pendingTomorrow.length > 0) {
    msg += `\n📌 *Jefe, mañana tienes:*\n`;
    pendingTomorrow.slice(0, 4).forEach(t => {
      msg += `  • ${txt(t.properties?.['Tarea'])}\n`;
    });
  }

  msg += `\n🧘 Usa */habito* para cerrar el día marcando tu Revisión Nocturna.\n`;
  msg += `💡 _"Reflexiona sobre el día. El examen de tu conducta es el examen de tu carácter."_ — Séneca`;

  await sendMsg(msg);
}

module.exports = { eveningReview };
