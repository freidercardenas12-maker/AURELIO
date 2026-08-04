const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
Object.assign(process.env, env);

const { generateSpeechBuffer } = require('../src/services/tts');
const { sendVoiceNote } = require('../src/services/telegram');

async function test() {
  console.log('Testing sendVoiceNote with sanitized chat_id...');
  const buf = await generateSpeechBuffer('Hola Freider, probando envío de nota de voz con sanitización de ID de chat.');
  if (buf) {
    console.log('Audio buffer:', buf.length, 'bytes');
    await sendVoiceNote(buf);
    console.log('Voice note test complete!');
  }
}

test().catch(e => console.error(e.message));
