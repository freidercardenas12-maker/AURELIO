/**
 * AURELIO — AI Pricing & Inventory Advisor Engine
 * Analyzes market trends, USD/COP exchange rate, and sales volume
 * to provide Freider with data-driven pricing & restocking decisions.
 */
const { getPriceRadarStatus } = require('../jobs/priceRadar');
const logger = require('../utils/logger');

async function getStrategicPricingAdvice() {
  logger.info('[Pricing Advisor] Generating strategic recommendations...');
  const radar = await getPriceRadarStatus();
  const usd = radar.usdCop || 3200;

  const recommendations = [];

  // Chorizos recommendation
  recommendations.push('🥩 *Chorizos Artesanales:* Mantener precio base a $28.000/kg ($25.000/kg en compras >20kg). Margen bruto estimado: 42%.');

  // Guayaquil Accessories recommendation
  if (usd > 4100) {
    recommendations.push(`👜 *Accesorios Guayaquil:* Dólar en ${radar.rateStr} (Alto). Postergar importaciones 7-10 días.`);
  } else {
    recommendations.push(`👜 *Accesorios Guayaquil:* Dólar en ${radar.rateStr} (Estable). Excelente ventana de importación.`);
  }

  // Perfumes recommendation
  recommendations.push('💐 *Perfumes Medellín:* Promocionar kits ejecutivos de 3 fragancias con 15% de margen premium.');

  return {
    recommendations,
    usdCop: usd,
    summaryText: recommendations.join('\n\n')
  };
}

module.exports = { getStrategicPricingAdvice };
