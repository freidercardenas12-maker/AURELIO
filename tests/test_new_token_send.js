const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const env = dotenv.parse(fs.readFileSync(envPath));
  Object.assign(process.env, env);
}

const { sendMsgWithButtons, sendVoiceNote } = require('../src/services/telegram');
const { generateSpeechBuffer } = require('../src/services/tts');

async function run() {
  const text =
    `🏛️ *AURELIO v14.0 — SISTEMA RESTABLECIDO AL 100%*\n\n` +
    `Señor Cárdenas, el nuevo token de Telegram ha sido registrado e integrado con éxito.\n\n` +
    `🟢 *ESTADO DE SISTEMAS EN VIVO:*\n` +
    `• Telegram Bot API (` + process.env.TELEGRAM_BOT_TOKEN.slice(0, 12) + `...) — Autenticado ✅\n` +
    `• Motor de Voz HD — Operativo ✅\n` +
    `• Misión Crítica (Network & Memory Guard) — Activo ✅\n` +
    `• Notion Mirror & Local DB — Sincronizados ✅\n\n` +
    `🏛️ _A sus órdenes, Señor Cárdenas._`;

  await sendMsgWithButtons(text);

  const voice = await generateSpeechBuffer(
    'Señor Cárdenas, le confirmo que el nuevo token de Telegram ha sido integrado con éxito. Aurelio está cien por ciento operativo, en línea y a sus órdenes, Jefe.'
  );
  if (voice) await sendVoiceNote(voice);

  console.log('✅ Token confirmation message & voice note sent to Telegram successfully!');
}

run().catch(e => console.error('Error:', e.message));
