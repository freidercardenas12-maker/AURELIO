/**
 * Generates 1-click WhatsApp wa.me link for quick customer messaging.
 * @param {string} phone Phone number (e.g. "573001234567" or "+573001234567")
 * @param {string} message Text of the message to pre-fill
 * @returns {string} Clickable URL
 */
function generateWhatsAppLink(phone = '', message = '') {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

module.exports = { generateWhatsAppLink };
