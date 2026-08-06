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
    `🏛️ *PROTOCOLO DE RESPETO Y TRATAMIENTO ACTUALIZADO*\n\n` +
    `Entendido y registrado al cien por ciento, *Señor Cárdenas*.\n\n` +
    `A partir de este momento, en CADA interacción por texto o por nota de voz, me dirijo a usted únicamente como **Señor Cárdenas** o **Jefe**.\n\n` +
    `📌 *REGLAS DE PROTOCOLO ACTIVAS:*\n` +
    `1. Tratamiento obligatorio: _"Señor Cárdenas"_ o _"Jefe"_\n` +
    `2. Cierre respetuoso: _"A sus órdenes, Señor Cárdenas."_ o _"Con gusto, Jefe."_\n` +
    `3. Lealtad y disciplina estoica en cada respuesta.\n\n` +
    `📤 _Commit: 80deff0 | GitHub: freidercardenas12-maker/AURELIO_\n\n` +
    `🏛️ _A sus órdenes, Señor Cárdenas._`;

  await sendMsgWithButtons(text);

  const voice = await generateSpeechBuffer(
    'Entendido y registrado al cien por ciento, Señor Cárdenas. A partir de este momento, en cada mensaje o nota de voz, me dirigiré a usted únicamente como Señor Cárdenas o Jefe. Todo el sistema está actualizado y a sus órdenes, Jefe.'
  );
  if (voice) await sendVoiceNote(voice);

  console.log('✅ Protocol confirmation sent to Telegram.');
}

run().catch(e => console.error(e.message));
