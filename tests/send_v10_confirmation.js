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
    `🌌 *AURELIO v10.0 GOD TIER — COMPLETAMENTE ACTIVO*\n\n` +
    `Buenos días, Sr. Cárdenas. Las 5 potencias definitivas han sido implementadas y están en ejecución:\n\n` +
    `✉️ *1. CORREOS POR VOZ*\n` +
    `   → Di: _"Escríbele un correo a Coraza con el resumen de tareas"_\n\n` +
    `🧾 *2. FACTURAS PDF PROFESIONALES*\n` +
    `   → Di: _"Factura para Asadero El Turco 25kg"_\n\n` +
    `📡 *3. RADAR USD/COP EN TIEMPO REAL*\n` +
    `   → Di: _"¿Cómo está el dólar?"_ (Monitoreo cada 30 min)\n\n` +
    `📢 *4. DIFUSIÓN MASIVA A CLIENTES CRM*\n` +
    `   → Di: _"Difusión: oferta especial esta semana"_\n\n` +
    `🟢 *5. MONITOR DE SALUD DEL SISTEMA*\n` +
    `   → Envíame: */status* o */memoria*\n\n` +
    `📤 _Commit: 132be11 | GitHub: freidercardenas12-maker/AURELIO_\n\n` +
    `🏛️ _"El hombre que mueve montañas comienza cargando pequeñas piedras." — A sus órdenes._`;

  await sendMsgWithButtons(text);

  const voice = await generateSpeechBuffer(
    'Señor Cárdenas, buenos días. Le confirmo que Aurelio versión diez punto cero God Tier está completamente activo y operativo. ' +
    'Las cinco potencias definitivas disponibles son: correos por voz, facturas en PDF profesionales, ' +
    'radar del dólar en tiempo real cada treinta minutos, difusión masiva a todos sus clientes del CRM, ' +
    'y el monitor de salud del sistema. Diga la palabra y ejecutamos. A sus órdenes.'
  );
  if (voice) await sendVoiceNote(voice);

  console.log('✅ v10.0 God Tier message sent to Telegram.');
}

run().catch(e => console.error(e.message));
