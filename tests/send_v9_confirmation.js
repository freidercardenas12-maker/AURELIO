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
    `🏛️ *AURELIO v9.0 — CONFIRMACIÓN DE ACTIVACIÓN*\n\n` +
    `Buenos días, Sr. Cárdenas. Las 3 potencias de inteligencia avanzada han sido integradas y están activas en este instante:\n\n` +
    `🧠 *1. MEMORIA DE SESIÓN PERSISTENTE*\n` +
    `   Ahora recuerdo nuestras conversaciones entre reinicios del servidor. Cada tema que tratamos queda guardado y lo uso de contexto.\n` +
    `   → Envíame */memoria* para ver lo que tengo registrado.\n\n` +
    `🔔 *2. ANTI-SPAM INTELIGENTE DE ALERTAS*\n` +
    `   Ya no recibirás alertas duplicadas de tu agenda cuando el sistema se reinicia. Cada alerta tiene un cooldown de 2 horas.\n\n` +
    `🟢 *3. MONITOR DE SALUD DEL SISTEMA EN TIEMPO REAL*\n` +
    `   → Envíame */status* para ver uptime, memoria activa y estado de todos mis subsistemas.\n\n` +
    `📤 _Commit: 315d3c4 | GitHub: freidercardenas12-maker/AURELIO_\n\n` +
    `🏛️ _"La excelencia no es un acto, es un hábito." — A sus órdenes._`;

  await sendMsgWithButtons(text);

  const voice = await generateSpeechBuffer(
    'Señor Cárdenas, buenos días. Le confirmo que la versión nueve punto cero de Aurelio está completamente activa. ' +
    'Las tres potencias implementadas son: memoria de sesión persistente entre reinicios, ' +
    'guard inteligente anti-spam de alertas, ' +
    'y el monitor de salud del sistema en tiempo real. ' +
    'Envíeme el comando barra status para ver todos mis sistemas en vivo.'
  );
  if (voice) await sendVoiceNote(voice);

  console.log('✅ v9.0 confirmation sent to Telegram.');
}

run().catch(e => console.error(e.message));
