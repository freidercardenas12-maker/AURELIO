const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsgWithButtons } = require('../services/telegram');
const { sel } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');
const logger = require('../utils/logger');

async function updateLivePinnedBoard() {
  logger.info('[Job] Updating Live Executive Pinned Board...');
  try {
    const today = getTodayStr();

    // 1. Finances
    const finances = await queryDB(config.FINANCES_DB_ID);
    let deudas = 0;
    finances.forEach(f => {
      if (sel(f.properties?.['Estado']) === 'Pendiente') deudas += f.properties?.['Monto']?.number || 0;
    });

    // 2. Agenda
    const agenda = await queryDB(config.AGENDA_DB_ID);
    const todayEvents = agenda.filter(a => a.properties?.Fecha?.date?.start === today);

    // 3. Tasks / Coraza
    const tasks = await queryDB(config.TASKS_DB_ID);
    const corazaTasks = tasks.filter(t => sel(t.properties?.['Estado']) !== 'Done');

    let board = `📌 *AURELIO v4.0 — TABLERO EJECUTIVO EN VIVO*\n`;
    board += `_Última actualización: ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}_\n\n`;

    board += `💰 *Finanzas:* Caja: $1.299.809 COP | Deudas: $${deudas.toLocaleString('es-CO')} COP\n`;
    board += `📅 *Agenda Hoy:* ${todayEvents.length > 0 ? `${todayEvents.length} compromisos agendados` : 'Sin reuniones urgentes hoy'}\n`;
    board += `🛡️ *Coraza CTA:* ${corazaTasks.length} tareas activas en Kanban\n`;
    board += `🥩 *Chorizos:* CRM activo — Envíos programados\n\n`;
    board += `👇 _Toca cualquier botón para ejecutar acciones de 1 toque:_`;

    await sendMsgWithButtons(board);
    logger.info('✅ Live Executive Pinned Board updated.');
  } catch (e) {
    logger.error(`[Live Board Error]: ${e.message}`);
  }
}

module.exports = { updateLivePinnedBoard };
