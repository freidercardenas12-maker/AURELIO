const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
Object.assign(process.env, env);

const { generateSpeechBuffer } = require('../src/services/tts');
const { sendVoiceNote } = require('../src/services/telegram');

async function test() {
  console.log('Sending live verification voice note to Telegram...');
  const buf = await generateSpeechBuffer('Prueba de voz en vivo en Render. Todos los sistemas de audio estan respondiendo perfectamente.');
  if (buf) {
    await sendVoiceNote(buf);
    console.log('Voice note sent live!');
  }
}

test().catch(e => console.error(e.message));
