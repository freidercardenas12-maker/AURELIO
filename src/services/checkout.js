const { sendMsgWithButtons, sendVoiceNote } = require('./telegram');
const { generateSpeechBuffer } = require('./tts');

async function handleSalesCheckout(clientText) {
  const qrNequiNumber = '310 123 4567';
  const bancolombiaAhorros = '123-456789-00';

  const checkoutMessage = 
    `🛒 *CENTRO DE PAGO Y DESPACHO — CHORIZOS ARTESANALES*\n\n` +
    `💳 *MÉTODOS DE PAGO DISPONIBLES:*\n\n` +
    `📱 *Nequi:* \`${qrNequiNumber}\`\n` +
    `🏦 *Bancolombia Ahorros:* \`${bancolombiaAhorros}\`\n\n` +
    `📋 *INSTRUCCIONES DE REGISTRO DE PEDIDO:*\n` +
    `1. Realiza la transferencia por Nequi o Bancolombia.\n` +
    `2. Envía la *captura del comprobante de pago* a este chat.\n` +
    `3. Aurelio validará el pago con Visión IA y programará tu envío automáticamente.\n\n` +
    `📍 *Envía tu dirección de entrega en una nota de voz o mensaje.*`;

  await sendMsgWithButtons(checkoutMessage);

  const voiceMsg = await generateSpeechBuffer(
    `Información de pago enviada. Puedes transferir por Nequi al número ${qrNequiNumber} o Bancolombia Ahorros. Al enviar el comprobante en foto, tu pedido quedará programado.`
  );
  if (voiceMsg) await sendVoiceNote(voiceMsg);
}

module.exports = { handleSalesCheckout };
