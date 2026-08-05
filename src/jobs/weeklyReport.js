const { generatePDF } = require('../services/pdf');
const { sendDocument, sendMsg } = require('../services/telegram');
const logger = require('../utils/logger');

async function runWeeklyReport() {
  logger.info('[Job] Generating Weekly Executive Consolidated PDF Report...');
  try {
    const pdfBuffer = await generatePDF();
    if (pdfBuffer && pdfBuffer.length > 0) {
      await sendDocument(pdfBuffer, `Aurelio_Informe_Semanal_Consolidado_${new Date().toISOString().split('T')[0]}.pdf`);
      await sendMsg('📊 *Informe Semanal Consolidado Generado y Adjuntado en PDF.*');
      logger.info('✅ Weekly Executive PDF Report sent successfully.');
    }
  } catch (e) {
    logger.error(`[Weekly Report Error]: ${e.message}`);
  }
}

module.exports = { runWeeklyReport };
