const logger = require('../utils/logger');

async function processWhatsAppMessage(from, body, mediaUrl = null) {
  logger.info(`[WhatsApp Engine] Incoming message from ${from}: "${body}"`);
  return {
    status: 'received',
    reply: `🏛️ [Aurelio WhatsApp] Mensaje recibido de ${from}. Procesando solicitud ejecutiva...`
  };
}

module.exports = {
  processWhatsAppMessage
};
