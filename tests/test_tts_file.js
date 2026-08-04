const fs = require('fs');
const { cleanTextForSpeech, generateSpeechBuffer } = require('../src/services/tts');
const { sendVoiceNote } = require('../src/services/telegram');

async function run() {
  const raw = fs.readFileSync('./tests/sample_response.txt', 'utf8');
  console.log('RAW:', raw);
  console.log('---');
  const cleaned = cleanTextForSpeech(raw);
  console.log('CLEANED:', cleaned);
  console.log('---');

  const buf = await generateSpeechBuffer(raw);
  if (buf) {
    console.log('Buffer:', buf.length, 'bytes');
    await sendVoiceNote(buf);
    console.log('Sent!');
  }
}
run().catch(e => console.error(e.message));
