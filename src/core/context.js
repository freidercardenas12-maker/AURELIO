const config = require('../config');
const { queryDB } = require('../services/notion');
const { txt, sel, num, dt } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');
const logger = require('../utils/logger');

async function buildContext(type) {
  const lines = [];

  try {
    if (type === 'CONSULTAR_FINANZAS' || type === 'CONSULTAR_TODO') {
      const rows = await queryDB(config.FINANCES_DB_ID);
      lines.push('═══ FINANZAS Y DEUDAS (Notion) ═══');
      if (!rows.length) {
        lines.push('Sin registros financieros.');
      } else {
        rows.forEach(r => {
          const p = r.properties || {};
          const c = txt(p['Concepto']) || 'Sin nombre';
          const m = num(p['Monto']);
          const e = sel(p['Estado']);
          const t = sel(p['Tipo']);
          const v = dt(p['Fecha de Vencimiento']);
          lines.push(`• ${c}: $${m.toLocaleString('es-CO')} | ${t} | ${e} | Vence: ${v}`);
        });
      }
    }

    if (type === 'CONSULTAR_TAREAS' || type === 'CONSULTAR_TODO') {
      const tasks = await queryDB(config.TASKS_DB_ID);
      lines.push('═══ KANBAN DE TAREAS (Notion) ═══');
      const pending = tasks.filter(t => {
        const s = sel(t.properties?.['Estado']);
        return s === 'To Do' || s === 'In Progress';
      });
      if (!pending.length) {
        lines.push('Sin tareas pendientes. ✅');
      } else {
        pending.forEach(t => {
          const p = t.properties || {};
          const titulo = txt(p['Tarea']) || 'Sin título';
          const estado = sel(p['Estado']);
          const fecha  = dt(p['Fecha de Entrega']);
          const prio   = sel(p['Prioridad']);
          lines.push(`• ${titulo}: ${estado} | Entrega: ${fecha}${prio ? ' | ' + prio : ''}`);
        });
      }
    }

    if (type === 'CONSULTAR_AGENDA' || type === 'CONSULTAR_TODO') {
      const agenda = await queryDB(config.AGENDA_DB_ID);
      lines.push('═══ AGENDA Y EVENTOS (Notion) ═══');
      const today = getTodayStr();
      const upcoming = agenda.filter(e => {
        const f = e.properties?.['Fecha']?.date?.start;
        return f && f >= today;
      }).slice(0, 8);
      if (!upcoming.length) {
        lines.push('Sin eventos próximos.');
      } else {
        upcoming.forEach(e => {
          const p = e.properties || {};
          const a   = txt(p['Actividad']) || '(sin nombre)';
          const f   = dt(p['Fecha']);
          const est = sel(p['Estado']);
          lines.push(`• ${a}: ${f} | ${est}`);
        });
      }
    }

    if (type === 'CONSULTAR_AGENDA' || type === 'CONSULTAR_TODO') {
      const crm = await queryDB(config.CRM_DB_ID);
      lines.push('═══ CLIENTES CHORIZOS - CRM (Notion) ═══');
      crm.slice(0, 10).forEach(c => {
        const p      = c.properties || {};
        const nombre = txt(p['Cliente / Puesto']);
        const pueblo = sel(p['Pueblo / Ubicación']);
        const freq   = sel(p['Frecuencia Despacho']);
        const ultimo = dt(p['Último Envío']);
        if (nombre) lines.push(`• ${nombre} (${pueblo}): Frecuencia: ${freq} | Último envío: ${ultimo}`);
      });
    }

    if (type === 'CONSULTAR_TODO' || type === 'CONSULTAR_CORAZA') {
      const coraza = await queryDB(config.CORAZA_DEV_DB_ID);
      lines.push('═══ CORAZA SEGURIDAD CTA — TABLERO DE DESARROLLO (Notion) ═══');
      if (!coraza.length) {
        lines.push('Sin tareas registradas en Coraza.');
      } else {
        const activas = coraza.filter(t => {
          const est = sel(t.properties?.['Estado']);
          return est !== 'Completado' && est !== 'Cancelado';
        });
        if (!activas.length) {
          lines.push('✅ Sin tareas activas en Coraza.');
        } else {
          activas.slice(0, 10).forEach(t => {
            const p     = t.properties || {};
            const tarea = txt(p['Tarea']) || 'Sin título';
            const est   = sel(p['Estado']);
            const prio  = sel(p['Prioridad']);
            const tipo  = sel(p['Tipo de Tarea']);
            const fecha = dt(p['Fecha de Entrega']);
            lines.push(`• ${tarea}: ${est} | ${tipo}${prio ? ' | ' + prio : ''} | Entrega: ${fecha}`);
          });
        }
      }
    }

    if (type === 'CONSULTAR_TODO') {
      const estrategia = await queryDB(config.ESTRATEGIA_DB_ID);
      lines.push('═══ ESTRATEGIA DE NEGOCIOS (Notion) ═══');
      estrategia.forEach(e => {
        const p    = e.properties || {};
        const neg  = txt(p['Negocio']);
        const fun  = txt(p['Función Principal']);
        const prio = num(p['Prioridad']);
        const cap  = num(p['Capital Sugerido']);
        const mar  = txt(p['Márgenes Estimados']);
        if (neg) lines.push(`• ${neg} [P${prio}]: ${fun} | Capital: $${cap.toLocaleString('es-CO')} | Margen: ${mar}`);
      });

      const sprints = await queryDB(config.SPRINTS_DB_ID);
      const activos = sprints.filter(s => sel(s.properties?.['Estado']) !== 'Completado');
      if (activos.length > 0) {
        lines.push('═══ SPRINTS ACTIVOS (Notion) ═══');
        activos.forEach(s => {
          const p      = s.properties || {};
          const nombre = txt(p['Nombre']);
          const obj    = txt(p['Objetivo']);
          const est    = sel(p['Estado']);
          lines.push(`• ${nombre}: ${obj} | ${est}`);
        });
      }
    }

  } catch (e) {
    logger.error(`[Context Error]: ${e.message}`);
  }
  return lines.join('\n');
}

module.exports = { buildContext };
