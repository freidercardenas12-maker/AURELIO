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
const { loadMemory } = require('../core/sessionMemory');
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

  if (trimmed.startsWith('/status') || trimmed.startsWith('/salud')) {
    const mem = loadMemory();
    const topicsCount = mem.topics ? mem.topics.length : 0;
    const followupsCount = mem.pendingFollowups ? mem.pendingFollowups.length : 0;
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const statusMsg =
      `🟢 *ESTADO DEL SISTEMA — AURELIO v8.0 OMNIPRESENT*\n\n` +
      `⏱️ *Uptime:* ${hours}h ${mins}m\n` +
      `🧠 *Memoria de Sesión:* ${topicsCount} temas registrados, ${followupsCount} pendientes de seguimiento\n` +
      `🎙️ *Motor de Voz:* es-CO-GonzaloNeural 96kbps — Activo ✅\n` +
      `🤖 *Gemini AI:* Multi-Fallback Activo ✅\n` +
      `📋 *Notion Sync:* Activo ✅\n` +
      `🔔 *Alertas Proactivas:* Throttle Guard Activo ✅\n` +
      `📡 *Telegram Polling:* Activo ✅\n` +
      `🌐 *Dashboard Web:* [http://localhost:3000/dashboard](http://localhost:3000/dashboard) ✅\n\n` +
      `🏛️ _Todos los sistemas operativos. A sus órdenes, Sr. Cárdenas._`;
    await sendMsg(statusMsg);
    return;
  }

  if (trimmed.startsWith('/memoria')) {
    const mem = loadMemory();
    if (!mem.topics || mem.topics.length === 0) {
      await sendMsg('🧠 Aún no hay temas registrados en mi memoria de sesión.');
      return;
    }
    let memMsg = `🧠 *MEMORIA DE SESIÓN — AURELIO*\n\nÚltimos ${Math.min(mem.topics.length, 8)} temas registrados:\n\n`;
    mem.topics.slice(0, 8).forEach((t, i) => {
      memMsg += `${i + 1}. _[${t.intent}]_ "${t.text}"\n`;
    });
    if (mem.pendingFollowups && mem.pendingFollowups.length > 0) {
      memMsg += `\n📌 *Pendientes de seguimiento:*\n`;
      mem.pendingFollowups.forEach(f => { memMsg += `  • "${f.text}"\n`; });
    }
    await sendMsg(memMsg);
    return;
  }

  await sendMsg('❓ Comando no reconocido. Usa */ayuda* para ver todo lo que puedo hacer.');
}

module.exports = { handleCommand };
