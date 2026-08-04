const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');

async function test() {
  console.log('Testing EdgeTTS male voice...');
  const tts = new EdgeTTS({
    voice: 'es-CO-GonzaloNeural', // Male Colombian Neural Voice
    lang: 'es-CO',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
  });

  const text = 'Hola Freider. Soy Aurelio, tu secretario ejecutivo. He actualizado mi voz a la red neuronal masculina más fluida y natural en español.';
  const filePath = './tests/test_gonzalo.mp3';
  await tts.ttsPromise(text, filePath);
  console.log('Saved to:', filePath, 'File size:', fs.statSync(filePath).size);
}

test().catch(e => console.error('EdgeTTS Error:', e));
