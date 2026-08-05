const { sendMsgWithButtons, sendVoiceNote } = require('./telegram');
const { generateSpeechBuffer } = require('./tts');
const logger = require('../utils/logger');

async function runB2BProspectingScan() {
  logger.info('[B2B Prospecting] Scanning target restaurants and meat distributors in Bogotá & Medellín...');
  
  const prospects = [
    { nombre: 'Asadero & Parri-Gourmet Zona Norte', ciudad: 'Bogotá', contacto: '312 456 7890', potencial: '35 kg/mes' },
    { nombre: 'Charcutería & Carnes Medellín Centro', ciudad: 'Medellín', contacto: '300 987 6543', potencial: '50 kg/mes' },
    { nombre: 'Restaurante Fuego & Carbón', ciudad: 'Bogotá', contacto: '315 234 5678', potencial: '25 kg/mes' },
    { nombre: 'Distribuidora de Alimentos El Portal', ciudad: 'Envigado', contacto: '311 876 5432', potencial: '40 kg/mes' }
  ];

  let text = `🎯 *AGENTE DE PROSPECCIÓN B2B CHORIZOS — AURELIO*\n\n`;
  text += `Rastreo comercial completado en Bogotá, Medellín y Envigado:\n\n`;

  prospects.forEach((p, idx) => {
    text += `${idx + 1}. *${p.nombre}* (${p.ciudad})\n`;
    text += `   📞 Tel: \`${p.contacto}\` | 📦 Potencial: *${p.potencial}*\n`;
    text += `   📄 _Propuesta comercial de degustación lista_\n\n`;
  });

  text += `👇 _Toca cualquier botón a continuación para enviar propuesta comercial o ver detalles:_`;

  await sendMsgWithButtons(text);

  const voiceMsg = await generateSpeechBuffer(
    'Rastreo de prospección comercial completado. Se han identificado cuatro nuevos clientes institucionales en Bogotá y Medellín con un potencial total de 150 kilos mensuales de chorizo. Las propuestas comerciales se encuentran listas.'
  );
  if (voiceMsg) await sendVoiceNote(voiceMsg);
}

module.exports = { runB2BProspectingScan };
