const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { bool } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');
const logger = require('../utils/logger');

async function middayCheck() {
  logger.info('[Job] Running Midday Check (12:00 PM)...');
  const today = getTodayStr();
  const habits = await queryDB(config.HABITS_DB_ID);
  const todayRow = habits.find(r => r.properties?.Fecha?.date?.start === today);

  if (!todayRow) return;

  const pD = bool(todayRow.properties?.['Planificación Diaria']);
  const lE = bool(todayRow.properties?.['Lectura Estoica (15 min)']);
  const eF = bool(todayRow.properties?.['Ejercicio Físico']);
  const cT = bool(todayRow.properties?.['Código / Trabajo']);
  const prog = todayRow.properties?.['Progreso Diario']?.formula?.string || '0%';

  const pendingHabits = [];
  if (!pD) pendingHabits.push('Planificación Diaria');
  if (!lE) pendingHabits.push('Lectura Estoica');
  if (!eF) pendingHabits.push('Ejercicio Físico');
  if (!cT) pendingHabits.push('Código/Trabajo');

  if (pendingHabits.length > 0) {
    let msg = `⏰ *Check de Mediodía — Aurelio*\n\n`;
    msg += `🧘 *Progreso de Hábitos:* \`${prog}\`\n\n`;
    msg += `⚠️ *Aún pendientes:*\n`;
    pendingHabits.forEach(h => { msg += `  ❌ ${h}\n`; });
    msg += `\n💡 Usa */hecho [habito]* para marcarlos.\n`;
    msg += `_"No digas que no tienes suficiente tiempo. Tienes exactamente las mismas horas que tuvo Miguel Ángel."_`;
    await sendMsg(msg);
  }
}

module.exports = { middayCheck };
