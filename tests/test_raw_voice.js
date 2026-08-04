// Test sendVoice using the fixed dedicated https.request
const https = require('https');
const { generateSpeechBuffer } = require('../src/services/tts');
const config = require('../src/config');

async function run() {
  const text = 'Hola Freider, soy Aurelio, tu secretario estoico. Todo bajo control.';
  const buffer = await generateSpeechBuffer(text);
  if (!buffer) { console.error('TTS null'); return; }
  console.log('Buffer size:', buffer.length, 'bytes');

  const boundary = 'AurelioVoice' + Date.now();
  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
    `${config.TELEGRAM_CHAT_ID}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="voice"; filename="voice.mp3"\r\n` +
    `Content-Type: audio/mpeg\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([header, buffer, footer]);

  console.log('Total body size:', body.length);

  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${config.TELEGRAM_BOT_TOKEN}/sendVoice`,
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length
    }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', d.substring(0, 500));
    });
  });
  req.on('error', e => console.error('Request error:', e.message));
  req.write(body);
  req.end();
}

run().catch(e => console.error('Fatal:', e.message));
