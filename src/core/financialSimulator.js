const { sendMsgWithButtons, sendVoiceNote } = require('../services/telegram');
const { generateSpeechBuffer } = require('../services/tts');
const logger = require('../utils/logger');

async function runFinancialSimulation6Months() {
  logger.info('[Financial Simulator] Running 6-Month Liquidity & Investment Projection...');

  const meses = ['Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero'];
  const arriendo = 1000000;
  const universidad = 2300000;
  const ventaChorizosProm = 3500000;
  const gastosOperativos = 800000;

  let text = `🔮 *SIMULACIÓN DE FLUJO DE CAJA A 6 MESES — AURELIO*\n\n`;
  text += `_Proyección basada en ventas promedio de chorizos y costos fijos de arriendo y universidad:_\n\n`;

  let cajaAcumulada = 1299809;

  meses.forEach(m => {
    const ingresos = ventaChorizosProm;
    const egresos = arriendo + (m === 'Agosto' || m === 'Enero' ? universidad : 0) + gastosOperativos;
    const netoMes = ingresos - egresos;
    cajaAcumulada += netoMes;

    const estadoTag = cajaAcumulada >= 0 ? '🟢 Excedente' : '🔴 Déficit';
    text += `📅 *${m}:* Net: $${netoMes.toLocaleString('es-CO')} | Acum: *$${cajaAcumulada.toLocaleString('es-CO')} COP* (${estadoTag})\n`;
  });

  text += `\n💡 *CONCLUSIÓN ESTRATÉGICA:*
`;
  text += `Manteniendo ventas de 140kg/mes de chorizos ($3.5M), la caja pasa a *excedente positivo a partir de Septiembre* ($1.7M COP libres para inversión).`;

  await sendMsgWithButtons(text);

  const voiceMsg = await generateSpeechBuffer(
    'Simulación financiera a seis meses completada. Al cubrir los compromisos de agosto con la meta de ventas de chorizos, el flujo de caja pasa a excedente libre positivo a partir de septiembre con un saldo estimado de un millón setecientos mil pesos para inversión.'
  );
  if (voiceMsg) await sendVoiceNote(voiceMsg);
}

module.exports = { runFinancialSimulation6Months };
