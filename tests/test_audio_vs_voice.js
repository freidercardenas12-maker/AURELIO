const fs = require('fs');
const path = require('path');
const https = require('https');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const token = env.TELEGRAM_BOT_TOKEN;
const chatId = String(env.TELEGRAM_CHAT_ID).trim().replace(/['"]/g, '');

const { generateSpeechBuffer } = require('../src/services/tts');

function sendMultipart(endpoint, fieldName, filename, mimeType, audioBuffer) {
  return new Promise((resolve) => {
    const boundary = '----AurelioAudio' + Date.now();
    const payloadHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
      `${chatId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullBody = Buffer.concat([payloadHeader, audioBuffer, payloadFooter]);

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`[${endpoint}] Status: ${res.statusCode} -> ${d.substring(0, 150)}`);
        resolve(res.statusCode === 200);
      });
    });
    req.on('error', e => {
      console.log(`[${endpoint}] Error: ${e.message}`);
      resolve(false);
    });
    req.write(fullBody);
    req.end();
  });
}

async function test() {
  console.log('Generating test audio...');
  const buf = await generateSpeechBuffer('Prueba de envio de voz y audio.');
  if (!buf) return;

  console.log('Testing sendVoice...');
  const voiceOk = await sendMultipart('sendVoice', 'voice', 'aurelio.mp3', 'audio/mpeg', buf);

  console.log('Testing sendAudio...');
  const audioOk = await sendMultipart('sendAudio', 'audio', 'aurelio.mp3', 'audio/mpeg', buf);
}

test();
