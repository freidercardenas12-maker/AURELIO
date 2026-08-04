const { EdgeTTS } = require('@andresaya/edge-tts');
const { sendVoiceNote } = require('../src/services/telegram');
const fs = require('fs');

async function test() {
  console.log('Testing @andresaya/edge-tts with es-CO-GonzaloNeural...');
  const tts = new EdgeTTS({
    voice: 'es-CO-GonzaloNeural', // Colombian Male Neural Voice
    lang: 'es-CO',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
  });

  const text = 'Hola Freider, soy Aurelio. Mi voz ha sido actualizada a la red neuronal masculina colombiana de Microsoft. Inteligente, fluida y 100% natural.';
  const filePath = './tests/gonzalo_voice.mp3';
  await tts.ttsPromise(text, filePath);
  
  const buffer = fs.readFileSync(filePath);
  console.log('Voice MP3 Generated! Size:', buffer.length, 'bytes');

  console.log('Sending voice note to Telegram...');
  await sendVoiceNote(buffer);
  console.log('Voice note sent to Telegram!');
}

test().catch(e => console.error('Error:', e));
