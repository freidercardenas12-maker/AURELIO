const { generateSpeechBuffer } = require('../src/services/tts');
const { makeRequest } = require('../src/services/telegram');
const config = require('../src/config');

async function run() {
  const text = 'Hola Freider, aqui Aurelio. Tu caja disponible es 1 millon 299 mil pesos colombianos. La disciplina del tiempo es el secreto del exito.';
  const buffer = await generateSpeechBuffer(text);
  if (!buffer) { console.error('TTS null'); return; }
  console.log('Buffer bytes:', buffer.length);

  const boundary = 'AurelioVoice' + Date.now();
  const payloadHeader = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
    `${config.TELEGRAM_CHAT_ID}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="voice"; filename="aurelio.mp3"\r\n` +
    `Content-Type: audio/mpeg\r\n\r\n`
  );
  const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([payloadHeader, buffer, payloadFooter]);

  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendVoice`;
  const res = await makeRequest(url, 'POST', {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }, body);
  console.log('Response:', res.statusCode, JSON.stringify(res.body).substring(0, 400));
}

run().catch(e => console.error(e.message));
