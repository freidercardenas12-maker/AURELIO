const { EdgeTTS } = require('@bestcodes/edge-tts');
const { sendVoiceNote } = require('../src/services/telegram');

async function test() {
  console.log('Testing @bestcodes/edge-tts...');
  const tts = new EdgeTTS({
    voice: 'es-CO-GonzaloNeural',
    lang: 'es-CO',
    rate: '0%',
    pitch: '0Hz'
  });

  const text = 'Hola Freider, soy Aurelio. Esta es mi nueva voz masculina red neuronal colombiana. Fluida, natural y ejecutiva.';
  console.log('Synthesizing audio...');
  await tts.synthesize(text, 'es-CO-GonzaloNeural');
  const buffer = await tts.toBuffer();
  console.log('Buffer bytes:', buffer ? buffer.length : 0);

  if (buffer && buffer.length > 0) {
    console.log('Sending voice note to Telegram...');
    await sendVoiceNote(buffer);
    console.log('Sent successfully!');
  }
}

test().catch(e => console.error('Error:', e));
