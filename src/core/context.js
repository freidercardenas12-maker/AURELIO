/**
 * AURELIO — Context Builder (REFACTORED v10.0)
 * 
 * KEY IMPROVEMENTS:
 * 1. ⚡ Parallel Notion queries (Promise.all) instead of sequential await chains
 * 2. 🗄️ In-memory cache (5-min TTL) — repeated queries are instant (0ms API calls)
 * 3. 🛡️ Retry + timeout protection via parallelSafe
 * 4. 🚀 CONSULTAR_TODO now runs all 6 DBs in parallel (was sequential)
 */
const config = require('../config');
const { queryDB } = require('../services/notion');
const { txt, sel, num, dt } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');
const { cachedQuery } = require('../utils/notionCache');
const { parallelSafe } = require('../utils/retry');
const logger = require('../utils/logger');

// Cached query helpers
const cq = (dbId) => cachedQuery(dbId, () => queryDB(dbId));

function buildFinancesLines(rows) {
  const lines = ['═══ FINANZAS Y DEUDAS (Notion) ═══'];
  if (!rows || !rows.length) { lines.push('Sin registros financieros.'); return lines; }
  rows.forEach(r => {
    const p = r.properties || {};
    lines.push(`• ${txt(p['Concepto']) || 'Sin nombre'}: $${num(p['Monto']).toLocaleString('es-CO')} | ${sel(p['Tipo'])} | ${sel(p['Estado'])} | Vence: ${dt(p['Fecha de Vencimiento'])}`);
  });
  return lines;
}

function buildTasksLines(rows) {
  const lines = ['═══ KANBAN DE TAREAS (Notion) ═══'];
  if (!rows) { lines.push('Sin tareas.'); return lines; }
  const pending = rows.filter(t => { const s = sel(t.properties?.['Estado']); return s === 'To Do' || s === 'In Progress'; });
  if (!pending.length) { lines.push('Sin tareas pendientes. ✅'); return lines; }
  pending.forEach(t => {
    const p = t.properties || {};
    lines.push(`• ${txt(p['Tarea']) || 'Sin título'}: ${sel(p['Estado'])} | Entrega: ${dt(p['Fecha de Entrega'])}${sel(p['Prioridad']) ? ' | ' + sel(p['Prioridad']) : ''}`);
  });
  return lines;
}

function buildAgendaLines(rows) {
  const lines = ['═══ AGENDA Y EVENTOS (Notion) ═══'];
  if (!rows) { lines.push('Sin eventos.'); return lines; }
  const today = getTodayStr();
  const upcoming = rows.filter(e => { const f = e.properties?.['Fecha']?.date?.start; return f && f >= today; }).slice(0, 8);
  if (!upcoming.length) { lines.push('Sin eventos próximos.'); return lines; }
  upcoming.forEach(e => {
    const p = e.properties || {};
    lines.push(`• ${txt(p['Actividad']) || '(sin nombre)'}: ${dt(p['Fecha'])} | ${sel(p['Estado'])}`);
  });
  return lines;
}

function buildCRMLines(rows) {
  const lines = ['═══ CLIENTES CHORIZOS - CRM (Notion) ═══'];
  if (!rows) { lines.push('Sin clientes.'); return lines; }
  rows.slice(0, 10).forEach(c => {
    const p = c.properties || {};
    const nombre = txt(p['Cliente / Puesto']);
    if (nombre) lines.push(`• ${nombre} (${sel(p['Pueblo / Ubicación'])}): Frecuencia: ${sel(p['Frecuencia Despacho'])} | Último envío: ${dt(p['Último Envío'])}`);
  });
  return lines;
}

function buildCorazaLines(rows) {
  const lines = ['═══ CORAZA SEGURIDAD CTA — TABLERO DE DESARROLLO (Notion) ═══'];
  if (!rows) { lines.push('Sin tareas en Coraza.'); return lines; }
  const activas = rows.filter(t => { const e = sel(t.properties?.['Estado']); return e !== 'Completado' && e !== 'Cancelado'; });
  if (!activas.length) { lines.push('✅ Sin tareas activas en Coraza.'); return lines; }
  activas.slice(0, 10).forEach(t => {
    const p = t.properties || {};
    lines.push(`• ${txt(p['Tarea']) || 'Sin título'}: ${sel(p['Estado'])} | ${sel(p['Tipo de Tarea'])}${sel(p['Prioridad']) ? ' | ' + sel(p['Prioridad']) : ''} | Entrega: ${dt(p['Fecha de Entrega'])}`);
  });
  return lines;
}

function buildEstrategiaLines(estrategiaRows, sprintRows) {
  const lines = ['═══ ESTRATEGIA DE NEGOCIOS (Notion) ═══'];
  if (estrategiaRows) {
    estrategiaRows.forEach(e => {
      const p = e.properties || {};
      const neg = txt(p['Negocio']);
      if (neg) lines.push(`• ${neg} [P${num(p['Prioridad'])}]: ${txt(p['Función Principal'])} | Capital: $${num(p['Capital Sugerido']).toLocaleString('es-CO')} | Margen: ${txt(p['Márgenes Estimados'])}`);
    });
  }
  if (sprintRows) {
    const activos = sprintRows.filter(s => sel(s.properties?.['Estado']) !== 'Completado');
    if (activos.length > 0) {
      lines.push('═══ SPRINTS ACTIVOS (Notion) ═══');
      activos.forEach(s => {
        const p = s.properties || {};
        lines.push(`• ${txt(p['Nombre'])}: ${txt(p['Objetivo'])} | ${sel(p['Estado'])}`);
      });
    }
  }
  return lines;
}

async function buildContext(type) {
  const allLines = [];
  try {
    if (type === 'CONSULTAR_TODO') {
      // ⚡ PARALLEL: Run all 6 DB queries simultaneously
      logger.info('[Context] Fetching all DBs in parallel...');
      const [finances, tasks, agenda, crm, coraza, estrategia, sprints] = await parallelSafe([
        () => cq(config.FINANCES_DB_ID),
        () => cq(config.TASKS_DB_ID),
        () => cq(config.AGENDA_DB_ID),
        () => cq(config.CRM_DB_ID),
        () => cq(config.CORAZA_DEV_DB_ID),
        () => cq(config.ESTRATEGIA_DB_ID),
        () => cq(config.SPRINTS_DB_ID)
      ], 8000);

      allLines.push(
        ...buildFinancesLines(finances),
        ...buildTasksLines(tasks),
        ...buildAgendaLines(agenda),
        ...buildCRMLines(crm),
        ...buildCorazaLines(coraza),
        ...buildEstrategiaLines(estrategia, sprints)
      );

    } else {
      // ⚡ PARALLEL: Fetch only the DBs needed for this intent
      const fetches = [];
      if (type === 'CONSULTAR_FINANZAS') fetches.push(['finances', () => cq(config.FINANCES_DB_ID)]);
      if (type === 'CONSULTAR_TAREAS') fetches.push(['tasks', () => cq(config.TASKS_DB_ID)]);
      if (type === 'CONSULTAR_AGENDA') {
        fetches.push(['agenda', () => cq(config.AGENDA_DB_ID)]);
        fetches.push(['crm', () => cq(config.CRM_DB_ID)]);
      }
      if (type === 'CONSULTAR_CORAZA') fetches.push(['coraza', () => cq(config.CORAZA_DEV_DB_ID)]);

      const results = await parallelSafe(fetches.map(([, fn]) => fn), 8000);
      const resultMap = {};
      fetches.forEach(([name], i) => { resultMap[name] = results[i]; });

      if (resultMap.finances) allLines.push(...buildFinancesLines(resultMap.finances));
      if (resultMap.tasks) allLines.push(...buildTasksLines(resultMap.tasks));
      if (resultMap.agenda) allLines.push(...buildAgendaLines(resultMap.agenda));
      if (resultMap.crm) allLines.push(...buildCRMLines(resultMap.crm));
      if (resultMap.coraza) allLines.push(...buildCorazaLines(resultMap.coraza));
    }
  } catch (e) {
    logger.error(`[Context Error]: ${e.message}`);
  }

  return allLines.join('\n');
}

module.exports = { buildContext };
