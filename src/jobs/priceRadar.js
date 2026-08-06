/**
 * AURELIO — Real-Time Price & Dollar Radar
 * Monitors COP/USD exchange rate and alerts Freider when price moves >1%
 */
const https = require('https');
const { sendMsgWithButtons, sendVoiceNote } = require('../services/telegram');
const { generateSpeechBuffer } = require('../services/tts');
const logger = require('../utils/logger');

let lastDollarRate = null;
const ALERT_THRESHOLD_PCT = 1.0; // alert if dolar moves more than 1%

function fetchDollarRate() {
  return new Promise((resolve) => {
    const url = 'https://api.exchangerate-api.com/v4/latest/USD';
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.rates?.COP || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function runPriceRadar() {
  logger.info('[Price Radar] Checking USD/COP exchange rate...');
  try {
    const currentRate = await fetchDollarRate();
    if (!currentRate) {
      logger.warn('[Price Radar] Could not fetch exchange rate.');
      return;
    }

    const rateStr = `$${Math.round(currentRate).toLocaleString('es-CO')} COP`;
    logger.info(`[Price Radar] Current USD/COP rate: ${rateStr}`);

    if (lastDollarRate !== null) {
      const changePct = ((currentRate - lastDollarRate) / lastDollarRate) * 100;

      if (Math.abs(changePct) >= ALERT_THRESHOLD_PCT) {
        const direction = changePct > 0 ? '📈 SUBIÓ' : '📉 BAJÓ';
        const advice = changePct > 0
          ? 'El dólar está caro. Espera para importar accesorios de Guayaquil.'
          : 'El dólar está barato. Buen momento para importar accesorios de Guayaquil.';

        const alertText =
          `📡 *RADAR DE PRECIOS — AURELIO*\n\n` +
          `💵 El dólar *${direction}* ${Math.abs(changePct).toFixed(2)}% en las últimas horas.\n\n` +
          `🔢 Tasa anterior: $${Math.round(lastDollarRate).toLocaleString('es-CO')} COP\n` +
          `🔢 Tasa actual: *${rateStr}*\n\n` +
          `💡 *Consejo estratégico:* ${advice}`;

        await sendMsgWithButtons(alertText);
        const voice = await generateSpeechBuffer(`Alerta de precio. El dólar ${direction.replace('📈','').replace('📉','')} ${Math.abs(changePct).toFixed(1)} por ciento. ${advice}`);
        if (voice) await sendVoiceNote(voice);
      }
    }

    lastDollarRate = currentRate;
  } catch (e) {
    logger.error(`[Price Radar Error]: ${e.message}`);
  }
}

async function getPriceRadarStatus() {
  const rate = await fetchDollarRate();
  return {
    usdCop: rate ? Math.round(rate) : null,
    rateStr: rate ? `$${Math.round(rate).toLocaleString('es-CO')} COP` : 'No disponible',
    advice: rate && rate > 4200
      ? '⚠️ Dólar alto — Aguarda para importar de Guayaquil.'
      : '✅ Dólar estable — Buen momento para importar.'
  };
}

module.exports = { runPriceRadar, getPriceRadarStatus };
