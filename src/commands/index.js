const { handleAgenda } = require('./agenda');
const { handleTareas, handleTerminar } = require('./tareas');
const { handleCaja, handleGasto } = require('./finanzas');
const { handleCoraza } = require('./coraza');
const { handleClientes } = require('./clientes');
const { handleNegocios } = require('./negocios');
const { handleHabito, handleHecho } = require('./habitos');
const { handleStartHelp } = require('./resumen');
const { sendMsg, sendDocument } = require('../services/telegram');
const { generateExecutivePDF } = require('../services/pdf');
const logger = require('../utils/logger');

async function handleCommand(text, jobsMap = {}) {
  const trimmed = text.trim();
  logger.info(`[Command Dispatcher] Processing command: "${trimmed}"`);

  if (trimmed.startsWith('/start') || trimmed.startsWith('/ayuda')) {
    await handleStartHelp();
    return;
  }

  if (trimmed.startsWith('/agenda')) {
    await handleAgenda();
    return;
  }

  if (trimmed.startsWith('/tareas')) {
    await handleTareas();
    return;
  }

  if (trimmed.startsWith('/terminar')) {
    await handleTerminar(trimmed);
    return;
  }

  if (trimmed.startsWith('/caja')) {
    await handleCaja();
    return;
  }

  if (trimmed.startsWith('/gasto')) {
    await handleGasto(trimmed);
    return;
  }

  if (trimmed.startsWith('/coraza')) {
    await handleCoraza();
    return;
  }

  if (trimmed.startsWith('/clientes')) {
    await handleClientes();
    return;
  }

  if (trimmed.startsWith('/negocios')) {
    await handleNegocios();
    return;
  }

  if (trimmed.startsWith('/habito')) {
    await handleHabito();
    return;
  }

  if (trimmed.startsWith('/hecho')) {
    await handleHecho(trimmed);
    return;
  }

  if (trimmed.startsWith('/briefing') || trimmed.startsWith('/resumen')) {
    if (jobsMap.morningBriefing) {
      await jobsMap.morningBriefing();
    } else {
      await sendMsg('🧠 Cargas de briefing activo...');
    }
    return;
  }

  if (trimmed.startsWith('/sincronizar')) {
    await sendMsg('🔄 *Sincronizando CRM de Chorizos con tu Agenda...*');
    if (jobsMap.syncCRM) await jobsMap.syncCRM();
    await sendMsg('✅ *Sincronización completada.*');
    return;
  }

  if (trimmed.startsWith('/reporte')) {
    await sendMsg('📄 *Generando Informe Ejecutivo en PDF...*');
    const pdfBuf = await generateExecutivePDF();
    if (pdfBuf) {
      await sendDocument(pdfBuf, `Aurelio_Informe_Ejecutivo_${new Date().toISOString().split('T')[0]}.pdf`, '📄 *Informe Ejecutivo en PDF — Aurelio v3.0*');
    } else {
      await sendMsg('❌ Error al generar el informe en PDF.');
    }
    return;
  }

  await sendMsg('❓ Comando no reconocido. Usa */ayuda* para ver todo lo que puedo hacer.');
}

module.exports = { handleCommand };
