const logger = require('../utils/logger');

async function processWhatsAppMessage(from, body, mediaUrl = null) {
  logger.info(`[WhatsApp Engine] Incoming message from ${from}: "${body}"`);
  return {
    status: 'received',
    reply: `🏛️ [Aurelio WhatsApp] Mensaje recibido de ${from}. Procesando solicitud ejecutiva...`
  };
}

function generateWhatsAppLink(phone, text = '') {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  if (!cleanPhone) return 'https://wa.me/';
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

module.exports = {
  processWhatsAppMessage,
  generateWhatsAppLink
};
