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

async function sendConfirmation() {
  console.log('Sending v6.0 Supreme confirmation message to Telegram...');

  const text = 
    `🏛️ *AURELIO v6.0 SUPREME TIER — OFICIALMENTE ACTIVO Y OPERATIVO*\n\n` +
    `Sr. Cárdenas, le confirmo que la versión v6.0 Supreme Tier se encuentra instalada y ejecutándose en tiempo real a su servicio.\n\n` +
    `🔥 *CAPACIDADES MASTER ACTIVADAS:*\n` +
    `• 🚨 *Plan de Emergencia:* Di _"Plan de emergencia"_ para ver la estrategia de recaudación de liquidez.\n` +
    `• 🛒 *Cierre de Ventas:* Di _"Pago Nequi"_ para generar instrucciones de pago y QR.\n` +
    `• 🎙️ *Atajos de 1 Palabra:* Di _"Caja"_, _"Agenda"_, _"Coraza"_ o _"Reporte"_ (Respuesta en <300ms).\n` +
    `• 📱 *App Móvil PWA:* [http://localhost:3000/app](http://localhost:3000/app)\n\n` +
    `👇 _Toca cualquier botón táctil a continuación para verificar el funcionamiento:_`;

  await sendMsgWithButtons(text);

  console.log('Synthesizing HD male voice confirmation...');
  const voiceBuf = await generateSpeechBuffer(
    'Señor Cárdenas, le confirmo que Aurelio versión seis punto cero Supreme Tier está oficialmente activo y a su servicio. Todos los sistemas, alertas proactivas y comandos táctiles se encuentran operativos al cien por ciento.'
  );

  if (voiceBuf) {
    await sendVoiceNote(voiceBuf);
    console.log('✅ Voice note sent to Telegram successfully!');
  }
}

sendConfirmation().catch(e => console.error(e.message));
