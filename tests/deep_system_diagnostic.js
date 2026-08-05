const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const env = dotenv.parse(fs.readFileSync(envPath));
  Object.assign(process.env, env);
}

const config = require('../src/config');
const { queryDB } = require('../src/services/notion');
const { geminiCall } = require('../src/services/gemini');
const { generateSpeechBuffer } = require('../src/services/tts');
const { makeRequest } = require('../src/services/telegram');

async function runDiagnostic() {
  console.log('========================================');
  console.log('🏛️ AURELIO SYSTEM DIAGNOSTIC — DEEP AUDIT');
  console.log('========================================');

  // 1. Credentials Check
  console.log('\n1. Checking Environment Variables...');
  console.log('   - TELEGRAM_BOT_TOKEN:', config.TELEGRAM_BOT_TOKEN ? '✅ SET (' + config.TELEGRAM_BOT_TOKEN.substring(0, 10) + '...)' : '❌ MISSING');
  console.log('   - TELEGRAM_CHAT_ID:', config.TELEGRAM_CHAT_ID ? '✅ SET (' + config.TELEGRAM_CHAT_ID + ')' : '❌ MISSING');
  console.log('   - NOTION_TOKEN:', config.NOTION_TOKEN ? '✅ SET' : '❌ MISSING');
  console.log('   - GEMINI_API_KEY:', config.GEMINI_API_KEY ? '✅ SET' : '❌ MISSING');

  // 2. Telegram Bot API
  console.log('\n2. Testing Telegram Bot API...');
  try {
    const meRes = await makeRequest(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getMe`, 'GET', {});
    if (meRes.statusCode === 200 && meRes.body?.ok) {
      console.log(`   ✅ Connected to Telegram Bot: @${meRes.body.result.username} (${meRes.body.result.first_name})`);
    } else {
      console.log(`   ❌ Telegram getMe failed: HTTP ${meRes.statusCode}`);
    }
  } catch (e) {
    console.log(`   ❌ Telegram error: ${e.message}`);
  }

  // 3. Notion Databases
  console.log('\n3. Testing Notion Databases...');
  try {
    const tasks = await queryDB(config.TASKS_DB_ID);
    console.log(`   ✅ Tasks DB query successful: ${tasks.length} rows found.`);
  } catch (e) {
    console.log(`   ❌ Notion Tasks DB error: ${e.message}`);
  }

  // 4. Gemini API
  console.log('\n4. Testing Gemini AI Model...');
  try {
    const res = await geminiCall('Hola, responde brevemente en 1 frase.');
    console.log(`   ✅ Gemini AI response: "${res.trim()}"`);
  } catch (e) {
    console.log(`   ❌ Gemini error: ${e.message}`);
  }

  // 5. EdgeTTS Voice Synthesis
  console.log('\n5. Testing EdgeTTS HD Male Voice Engine...');
  try {
    const buf = await generateSpeechBuffer('Prueba de voz de Aurelio.');
    if (buf && buf.length > 0) {
      console.log(`   ✅ EdgeTTS HD Audio generated: ${buf.length} bytes.`);
    } else {
      console.log('   ❌ EdgeTTS returned empty buffer.');
    }
  } catch (e) {
    console.log(`   ❌ EdgeTTS error: ${e.message}`);
  }

  console.log('\n========================================');
  console.log('DIAGNOSTIC COMPLETE');
  console.log('========================================');
}

runDiagnostic();
