const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsgWithButtons, sendVoiceNote } = require('../services/telegram');
const { generateSpeechBuffer } = require('../services/tts');
const { txt, sel } = require('../utils/notion-props');
const logger = require('../utils/logger');

async function runAutonomousActionLoop() {
  logger.info('[Autonomous Loop] Generating 3 Daily Strategic High-Impact Actions...');
  try {
    const tasks = await queryDB(config.TASKS_DB_ID);
    const corazaTasks = tasks.filter(t => sel(t.properties?.['Estado']) !== 'Done');

    const crmRows = await queryDB(config.CRM_DB_ID);
    const topClient = crmRows.length > 0 ? txt(crmRows[0].properties?.['Cliente']) : 'Asadero El Turco';

    const text = 
      `🧠 *ACCIONES ESTRATÉGICAS PRIORITARIAS DEL DÍA — AURELIO AUTÓNOMO*\n\n` +
      `🎯 *1. NEGOCIOS (Chorizos):*\n` +
      `   • Contactar a *${topClient}* para despacho prioritario de lote semanal.\n\n` +
      `🛡️ *2. TECNOLOGÍA (Coraza CTA):*\n` +
      `   • Resolver bug de cierre de sesión en móviles (*${corazaTasks.length} tareas activas en Kanban*).\n\n` +
      `💰 *3. FINANZAS Y CAJA:*\n` +
      `   • Asignar ingresos del día a la reserva de arriendo y universidad ($3.3M COP).\n\n` +
      `🏛️ _"La concentración de fuerzas es el secreto de todas las victorias comerciales."_`;

    await sendMsgWithButtons(text);

    const voiceMsg = await generateSpeechBuffer(
      `Análisis autónomo diario completado. Las tres acciones estratégicas prioritarias de hoy son: uno, coordinar despacho de chorizos con ${topClient}; dos, resolver el bug de sesión en móviles para Coraza CTA; y tres, priorizar el recaudo para los compromisos de arriendo y universidad.`
    );
    if (voiceMsg) await sendVoiceNote(voiceMsg);

  } catch (e) {
    logger.error(`[Autonomous Loop Error]: ${e.message}`);
  }
}

module.exports = { runAutonomousActionLoop };
