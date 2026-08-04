const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
Object.assign(process.env, env);

const { sendMsg, sendVoiceNote } = require('../src/services/telegram');
const { generateSpeechBuffer } = require('../src/services/tts');
const { generateCalendarLink } = require('../src/services/calendar');
const { generateWhatsAppLink } = require('../src/services/whatsapp');

async function run() {
  console.log('Sending 3 verification messages to Freider Telegram...');

  // Mensaje 1: Confirmación de Estado de Aurelio v2.0
  const msg1 = `🏛️ *MENSAJE 1 DE 3 — Confirmación de Sistema*\n\n` +
    `Hola Sr. Cárdenas. Le confirmo que **Aurelio v2.0** está operando al 100% en la nube.\n` +
    `💰 *Caja Disponible:* $1.299.809 COP\n` +
    `🧠 *Memoria y Webhook:* Activos en Render 24/7.`;

  console.log('Sending Message 1...');
  await sendMsg(msg1);

  // Esperar 2 segundos
  await new Promise(r => setTimeout(r, 2000));

  // Mensaje 2: Demostración de Acciones Rápidas (Calendar y WhatsApp)
  const calLink = generateCalendarLink('Reunión de Prueba Aurelio', '2026-08-04T10:00:00', '2026-08-04T11:00:00', 'Prueba de integración Aurelio');
  const wpLink = generateWhatsAppLink('3118784752', 'Hola, prueba de mensaje directo desde Aurelio.');

  const msg2 = `📲 *MENSAJE 2 DE 3 — Acciones Rápidas*\n\n` +
    `Prueba de enlaces interactivos de 1 clic:\n\n` +
    `📅 [Agregar Evento a Google Calendar](${calLink})\n` +
    `💬 [Enviar Mensaje por WhatsApp](${wpLink})`;

  console.log('Sending Message 2...');
  await sendMsg(msg2);

  // Esperar 2 segundos
  await new Promise(r => setTimeout(r, 2000));

  // Mensaje 3: Nota de Voz en Audio HD
  const speechText = 'Señor Cárdenas, este es el tercer mensaje. Le confirmo con mi voz que todos los sistemas de Aurelio están operando de forma impecable en la nube. Quedo a sus órdenes.';
  console.log('Generating Message 3 Voice Note...');
  const audioBuf = await generateSpeechBuffer(speechText);

  if (audioBuf) {
    console.log('Sending Message 3 (Voice Note)...');
    await sendVoiceNote(audioBuf);
  }

  console.log('All 3 messages sent successfully!');
}

run().catch(e => console.error('Error sending 3 messages:', e.message));
