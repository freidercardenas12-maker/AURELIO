/**
 * AURELIO — Mass CRM Broadcast Engine
 * Sends a personalized message to all active CRM clients with 1 voice command
 */
const config = require('../config');
const { queryDB } = require('./notion');
const { sendMsgWithButtons, sendVoiceNote } = require('./telegram');
const { generateSpeechBuffer } = require('./tts');
const { txt, sel } = require('../utils/notion-props');
const { geminiCall } = require('./gemini');
const logger = require('../utils/logger');

async function runCRMBroadcast(instruction) {
  logger.info(`[CRM Broadcast] Starting mass client broadcast: "${instruction}"`);

  // Get all active CRM clients
  const crmRows = await queryDB(config.CRM_DB_ID);
  const activeClients = crmRows.filter(c => {
    const estado = sel(c.properties?.['Estado']);
    return !estado || estado === 'Activo' || estado === 'Recurrente';
  });

  if (activeClients.length === 0) {
    await sendMsgWithButtons('⚠️ No hay clientes activos en tu CRM para hacer la difusión.');
    return;
  }

  // Use Gemini to craft the broadcast message
  const prompt = `Eres el asistente de ventas de Chorizos Artesanales. Redacta un mensaje corto, atractivo y profesional en español para enviar a clientes de chorizo artesanal basado en:\n"${instruction}"\nEl mensaje debe ser persuasivo, amigable y terminar con una llamada a la acción. Máximo 3 párrafos.`;

  let broadcastMsg = instruction;
  try {
    broadcastMsg = await geminiCall(prompt);
  } catch (e) {
    logger.warn(`[CRM Broadcast] Gemini fallback: ${e.message}`);
  }

  // Show preview with client count
  const clientNames = activeClients.slice(0, 5).map(c => txt(c.properties?.['Cliente']) || 'Cliente').join(', ');
  const previewText =
    `📢 *DIFUSIÓN MASIVA CRM — AURELIO*\n\n` +
    `👥 *Clientes objetivo:* ${activeClients.length} clientes activos\n` +
    `_(${clientNames}${activeClients.length > 5 ? ` y ${activeClients.length - 5} más...` : ''})_\n\n` +
    `📝 *Mensaje a enviar:*\n\n${broadcastMsg}\n\n` +
    `✅ _Mensaje diseñado por Aurelio AI y listo para difusión._`;

  await sendMsgWithButtons(previewText);

  const voice = await generateSpeechBuffer(
    `Difusión masiva preparada para ${activeClients.length} clientes activos de tu CRM. El mensaje ha sido redactado por inteligencia artificial y está listo. Revísalo en Telegram.`
  );
  if (voice) await sendVoiceNote(voice);

  logger.info(`[CRM Broadcast] Broadcast prepared for ${activeClients.length} clients.`);
}

module.exports = { runCRMBroadcast };
