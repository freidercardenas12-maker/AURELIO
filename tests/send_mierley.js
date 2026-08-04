const { generateSpeechBuffer } = require('../src/services/tts');
const { sendVoiceNote, sendMsg } = require('../src/services/telegram');
const { generateWhatsAppLink } = require('../src/services/whatsapp');

async function run() {
  const cliente = 'Mierley';
  const telefono = '3118784752';
  const mensajeTexto = `Hola ${cliente}, de parte de Chorizos Cárdenas estamos muy felices de saludarte. Esperamos que te encuentres de lo mejor y quedamos a tu entera disposición. ¡Que tengas un excelente día!`;

  console.log('Generating HD voice note for Mierley...');
  const audioBuffer = await generateSpeechBuffer(mensajeTexto);

  if (audioBuffer) {
    console.log('Sending voice note to Telegram...');
    await sendVoiceNote(audioBuffer);

    const wpLink = generateWhatsAppLink(telefono, mensajeTexto);

    const infoMsg = `📲 *Nota de Voz Generada para Mierley*\n\n` +
      `👤 *Cliente:* Mierley\n` +
      `📞 *Teléfono:* +57 ${telefono}\n\n` +
      `🎙️ _Te acabo de enviar la nota de voz en HD arriba en el chat. Puedes reenviarla directamente por WhatsApp a Mierley o usar el enlace rápido:_\n\n` +
      `👉 [Abrir Chat de WhatsApp con Mierley](${wpLink})`;

    await sendMsg(infoMsg);
    console.log('Done!');
  }
}

run().catch(e => console.error('Error:', e.message));
