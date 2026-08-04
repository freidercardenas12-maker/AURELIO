const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel } = require('../utils/notion-props');
const { getTodayStr, getTomorrowStr } = require('../utils/dates');
const logger = require('../utils/logger');

async function morningBriefing() {
  logger.info('[Job] Running Morning Briefing (7:00 AM)...');
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();

  const tasks = await queryDB(config.TASKS_DB_ID);
  const pending = tasks.filter(t => {
    const st = sel(t.properties?.['Estado']);
    return st === 'To Do' || st === 'In Progress';
  });

  const dueToday = pending.filter(t => t.properties?.['Fecha de Entrega']?.date?.start === today);
  const dueTomorrow = pending.filter(t => t.properties?.['Fecha de Entrega']?.date?.start === tomorrow);

  const finances = await queryDB(config.FINANCES_DB_ID);
  let deudas = 0;
  finances.forEach(f => {
    if (sel(f.properties?.['Estado']) === 'Pendiente') {
      deudas += f.properties?.['Monto']?.number || 0;
    }
  });

  const habits = await queryDB(config.HABITS_DB_ID);
  const todayHabits = habits.find(r => r.properties?.Fecha?.date?.start === today);

  let msg = `🏛️ *Briefing Matutino — Aurelio*\n\n`;
  msg += `💰 *Caja:* $${(1299809).toLocaleString('es-CO')} COP | Deudas: $${deudas.toLocaleString('es-CO')} COP\n\n`;

  if (dueToday.length > 0) {
    msg += `📌 *Tareas de HOY (${dueToday.length}):*\n`;
    dueToday.slice(0, 3).forEach(t => {
      msg += `  • ${txt(t.properties?.['Tarea'])}\n`;
    });
    if (dueToday.length > 3) msg += `  _...y ${dueToday.length - 3} más_\n`;
  } else {
    msg += `📌 *Tareas hoy:* Sin vencimientos inmediatos ✅\n`;
  }

  if (dueTomorrow.length > 0) {
    msg += `\n⏰ *Mañana vence:*\n`;
    dueTomorrow.slice(0, 2).forEach(t => {
      msg += `  • ${txt(t.properties?.['Tarea'])}\n`;
    });
  }

  msg += `\n🧘 *Hábitos:* ${todayHabits ? 'Registro activo — usa /habito para ver progreso' : 'Sin registro hoy'}\n`;
  msg += `\n💡 _"Comienza haciendo lo necesario, luego lo posible, y de repente estarás haciendo lo imposible."_`;

  await sendMsg(msg);
}

module.exports = { morningBriefing };
