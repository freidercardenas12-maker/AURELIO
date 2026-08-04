const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel, dt } = require('../utils/notion-props');

async function handleCoraza() {
  await sendMsg('🛡️ Consultando Tablero de Coraza Seguridad CTA...');
  const tareas = await queryDB(config.CORAZA_DEV_DB_ID);
  const activas = tareas.filter(t => {
    const est = sel(t.properties?.['Estado']);
    return est !== 'Completado' && est !== 'Cancelado';
  });

  if (!activas.length) {
    await sendMsg('✅ *Sin tareas activas en Coraza Seguridad CTA.* ¡Tablero limpio!');
    return;
  }

  let msg = `🛡️ *Coraza Seguridad CTA — Tareas Activas (${activas.length})*\n\n`;
  const iconEst = { 'En Curso': '🟢', 'QA / Pruebas': '🟡', 'Backlog': '⚪' };

  activas.slice(0, 8).forEach(t => {
    const p     = t.properties || {};
    const tarea = txt(p['Tarea']) || 'Sin título';
    const est   = sel(p['Estado']);
    const tipo  = sel(p['Tipo de Tarea']);
    const prio  = sel(p['Prioridad']);
    const fecha = dt(p['Fecha de Entrega']);
    const ic    = iconEst[est] || '⚪';
    msg += `${ic} *${tarea}*\n   ${tipo}${prio ? ' | `' + prio + '`' : ''} | 📆 ${fecha}\n`;
  });

  if (activas.length > 8) msg += `\n_...y ${activas.length - 8} más en Notion._`;
  await sendMsg(msg);
}

module.exports = { handleCoraza };
