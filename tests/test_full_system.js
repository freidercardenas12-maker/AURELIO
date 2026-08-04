const https = require('https');
const { geminiCall } = require('../src/services/gemini');
const { generateSpeechBuffer } = require('../src/services/tts');

async function checkRenderHealth() {
  return new Promise((resolve) => {
    https.get('https://aurelio-bot.onrender.com/health', (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('1. Render Health Check:', res.statusCode, d.substring(0, 100));
        resolve(res.statusCode === 200);
      });
    }).on('error', e => {
      console.log('1. Render Health Error:', e.message);
      resolve(false);
    });
  });
}

async function testAll() {
  console.log('=== AURELIO FULL SYSTEM DIAGNOSTIC ===');
  await checkRenderHealth();

  console.log('2. Testing Gemini LLM Chat (gemini-flash-latest)...');
  const chatReply = await geminiCall('Hola Aurelio, confirma estado.');
  console.log('   Gemini Reply:', chatReply ? chatReply.substring(0, 100) : 'NULL');

  console.log('3. Testing Audio Synthesis (TTS Dual Engine)...');
  const audioBuf = await generateSpeechBuffer('Prueba de voz completada exitosamente.');
  console.log('   Audio Bytes:', audioBuf ? audioBuf.length : 'NULL');

  console.log('=== DIAGNOSTIC COMPLETE ===');
}

testAll().catch(e => console.error('Diagnostic error:', e.message));
