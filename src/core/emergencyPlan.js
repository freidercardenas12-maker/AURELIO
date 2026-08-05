const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsgWithButtons, sendVoiceNote } = require('../services/telegram');
const { generateSpeechBuffer } = require('../services/tts');
const { txt, sel } = require('../utils/notion-props');
const logger = require('../utils/logger');

async function runEmergencyFinancialPlan() {
  logger.info('[Emergency Plan] Executing Financial Liquidity Rescue Plan...');
  try {
    const finances = await queryDB(config.FINANCES_DB_ID);
    let deudas = 0;
    finances.forEach(f => {
      if (sel(f.properties?.['Estado']) === 'Pendiente') {
        deudas += f.properties?.['Monto']?.number || 0;
      }
    });

    const cajaActual = 1299809;
    const deficit = Math.max(0, deudas - cajaActual);

    // Calculate kg of chorizos needed
    const precioKg = 25000;
    const kgNecesarios = Math.ceil(deficit / precioKg);

    // Get CRM VIP Clients
    const crmRows = await queryDB(config.CRM_DB_ID);
    const topClients = crmRows.slice(0, 4).map(c => txt(c.properties?.['Cliente']) || 'Cliente VIP');

    const text = 
      `🚨 *PLAN DE ACCIÓN Y EMERGENCIA FINANCIERA — AURELIO*\n\n` +
      `💰 *Caja Disponible:* $${cajaActual.toLocaleString('es-CO')} COP\n` +
      `📌 *Compromisos Vencimiento 9 Ago:* $${deudas.toLocaleString('es-CO')} COP\n` +
      `⚠️ *DÉFICIT CRÍTICO A CUBRIR:* *$${deficit.toLocaleString('es-CO')} COP*\n\n` +
      `🥩 *ESTRATEGIA DE RECAUDO CON CHORIZOS:*
` +
      `  • Meta de ventas: *${kgNecesarios} kg de Chorizo* ($${precioKg.toLocaleString('es-CO')}/kg)\n` +
      `  • Ingreso proyectado: *$${(kgNecesarios * precioKg).toLocaleString('es-CO')} COP*\n\n` +
      `📞 *5 LLAMADAS VIP DE RECAUDO PRIORITARIAS:*
` +
      (topClients.length > 0 ? topClients.map((c, i) => `  ${i+1}. *${c}* — Ofrecer lote de ${Math.ceil(kgNecesarios / topClients.length)} kg`).join('\n') : '  1. Asadero El Turco (25kg)\n  2. Tienda La Abundancia (20kg)\n  3. Distribuidora Medellín (20kg)') +
      `\n\n🏛️ _"No hay viento favorable para el que no sabe a dónde va. Ejecutemos la meta hoy."_`;

    await sendMsgWithButtons(text);

    const voiceBuf = await generateSpeechBuffer(
      `Plan de emergencia financiera activado. El déficit a cubrir antes del 9 de agosto es de $${deficit.toLocaleString('es-CO')} pesos. La meta es vender ${kgNecesarios} kilos de chorizo. Iniciemos las llamadas a los clientes VIP.`
    );
    if (voiceBuf) await sendVoiceNote(voiceBuf);

  } catch (e) {
    logger.error(`[Emergency Plan Error]: ${e.message}`);
  }
}

module.exports = { runEmergencyFinancialPlan };
