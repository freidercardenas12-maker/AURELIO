const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel, dt } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');

async function handleAgenda() {
  await sendMsg('⏳ Consultando tu agenda en Notion...');
  const agenda = await queryDB(config.AGENDA_DB_ID);
  const today = getTodayStr();
  const upcoming = agenda.filter(e => {
    const f = e.properties?.['Fecha']?.date?.start;
    return f && f >= today;
  }).slice(0, 8);

  if (!upcoming.length) {
    await sendMsg('📅 *Sin eventos próximos en tu agenda.*');
    return;
  }

  let msg = `📅 *Agenda Próxima (Notion)*\n\n`;
  const { generateCalendarLink } = require('../services/calendar');
  upcoming.forEach(e => {
    const p = e.properties || {};
    const a   = txt(p['Actividad']) || '(sin nombre)';
    const f   = dt(p['Fecha']);
    const est = sel(p['Estado']);
    const icon = est === 'Completado' ? '✅' : '📌';
    const calLink = generateCalendarLink(a, f, f, `Agendado en Notion por Aurelio`);
    msg += `${icon} *${a}*\n   📆 ${f}${est ? ' | ' + est : ''}\n   📅 [Agregar a Google Calendar](${calLink})\n\n`;
  });
  await sendMsg(msg);
}

module.exports = { handleAgenda };
