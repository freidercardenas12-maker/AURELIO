const config = require('../config');
const { queryDB, patchPage } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel, dt } = require('../utils/notion-props');

async function handleTareas() {
  const tasks = await queryDB(config.TASKS_DB_ID);
  const pending = tasks.filter(t => ['To Do', 'In Progress'].includes(sel(t.properties?.['Estado'])));

  if (!pending.length) {
    await sendMsg('✅ *Sin tareas pendientes.* ¡El tablero está limpio!');
    return;
  }

  let msg = `📌 *Tareas Pendientes (${pending.length}):*\n\n`;
  pending.slice(0, 8).forEach(t => {
    const p = t.properties || {};
    const st = sel(p['Estado']);
    const icon = st === 'In Progress' ? '🔵' : '⚪';
    const titulo = txt(p['Tarea']) || 'Sin título';
    const fecha = dt(p['Fecha de Entrega']);
    const prio = sel(p['Prioridad']);
    msg += `${icon} *${titulo}*${fecha !== 'sin fecha' ? ' — ' + fecha : ''}${prio ? ' `' + prio + '`' : ''}\n`;
  });
  if (pending.length > 8) msg += `\n_...y ${pending.length - 8} más en Notion._`;
  msg += `\n\n💡 Usa */terminar [nombre]* para completarlas.`;
  await sendMsg(msg);
}

async function handleTerminar(text) {
  const busqueda = text.slice(9).trim().toLowerCase();
  if (!busqueda) {
    await sendMsg('⚠️ Uso: `/terminar [parte del nombre]`\nEj: `/terminar llamar proveedor`');
    return;
  }

  await sendMsg(`🔍 Buscando _"${busqueda}"_ en tu Kanban...`);
  const tasks = await queryDB(config.TASKS_DB_ID);
  const match = tasks.find(t => (txt(t.properties?.['Tarea'])).toLowerCase().includes(busqueda));

  if (!match) {
    await sendMsg(`❌ No encontré tarea con _"${busqueda}"_.\n\n💡 Usa */tareas* para ver los nombres exactos.`);
    return;
  }

  const nombre = txt(match.properties?.['Tarea']);
  const estadoActual = sel(match.properties?.['Estado']);

  if (estadoActual === 'Done') {
    await sendMsg(`✅ *"${nombre}"* ya estaba como *Done*.`);
    return;
  }

  const result = await patchPage(match.id, { 'Estado': { status: { name: 'Done' } } });
  if (result) {
    await sendMsg(`✅ *¡Tarea Completada!*\n\n📌 *${nombre}*\n🔄 \`${estadoActual}\` ➔ *Done*\n\n💡 _"La disciplina es el camino hacia la libertad."_ — Epicteto`);
  } else {
    await sendMsg('❌ Error al actualizar en Notion. Verifica tu conexión.');
  }
}

module.exports = { handleTareas, handleTerminar };
