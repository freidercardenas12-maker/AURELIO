const { generateSpeechBuffer } = require('../src/services/tts');
const { sendVoiceNote } = require('../src/services/telegram');

const testText = `Hola Freider, aquí Aurelio. Tu caja disponible es 1.299.809 pesos colombianos. Tienes deudas pendientes por 3.438.576 pesos. Prioridad de hoy: asegurar liquidez mediante los despachos de Chorizos. Mañana tienes la reunión de entrega en Coraza Seguridad. La disciplina del tiempo es el secreto del éxito.`;

async function run() {
  console.log('Generating TTS...');
  const buffer = await generateSpeechBuffer(testText);
  if (!buffer) { console.error('TTS failed — null buffer'); return; }
  console.log('TTS OK — bytes:', buffer.length);
  console.log('Sending voice note to Telegram...');
  await sendVoiceNote(buffer);
  console.log('Done!');
}

run().catch(e => console.error('Error:', e.message));
