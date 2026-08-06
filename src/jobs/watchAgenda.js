const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsgWithButtons, sendVoiceNote } = require('../services/telegram');
const { generateSpeechBuffer } = require('../services/tts');
const { txt, sel } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');
const logger = require('../utils/logger');

const { shouldSendAlert } = require('../utils/alertThrottle');

let notifiedMeetingsCache = new Set();

async function watchAgendaMeetings() {
  try {
    const todayStr = getTodayStr();
    const agenda = await queryDB(config.AGENDA_DB_ID);

    const todayEvents = agenda.filter(e => {
      const fechaStart = e.properties?.['Fecha']?.date?.start;
      const estado = sel(e.properties?.['Estado']);
      return fechaStart && fechaStart.startsWith(todayStr) && estado !== 'Completado';
    });

    for (const event of todayEvents) {
      const id = event.id;
      if (notifiedMeetingsCache.has(id)) continue;

      const actividad = txt(event.properties?.['Actividad']) || 'Reunión / Evento';
      const fechaFull = event.properties?.['Fecha']?.date?.start || '';

      // Throttle: only send once per 2 hours per event
      const alertKey = `agenda_${id}_${getTodayStr()}`;
      if (!shouldSendAlert(alertKey, 2 * 60 * 60 * 1000)) continue;

      const horaMatch = actividad.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b|\b(1[0-2]|0?[1-9])\s*(am|pm)\b/i);
      const horaStr = fechaFull.includes('T') ? fechaFull.split('T')[1].substring(0, 5) : (horaMatch ? horaMatch[0] : 'Hoy');

      notifiedMeetingsCache.add(id);
      logger.info(`[Watch Agenda] Proactive meeting alert sent for: "${actividad}"`);

      const alertText = 
        `⏰ *ALERTA DE REUNIÓN / COMPROMISO*\n\n` +
        `📌 *${actividad}*\n` +
        `📆 Programado para: *${horaStr}*\n` +
        `📍 Registrado en tu Agenda de Notion\n\n` +
        `🏛️ _"Que la improvisación no reemplace la preparación."_ — Aurelio`;

      await sendMsgWithButtons(alertText);

      const voiceMsg = await generateSpeechBuffer(`Señor Cárdenas, alerta de compromiso. Tiene programado: ${actividad} a las ${horaStr}.`);
      if (voiceMsg) await sendVoiceNote(voiceMsg);
    }
  } catch (e) {
    logger.error(`[Watch Agenda Error]: ${e.message}`);
  }
}

module.exports = { watchAgendaMeetings };
