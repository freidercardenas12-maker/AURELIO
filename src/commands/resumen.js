const { sendMsg } = require('../services/telegram');

async function handleStartHelp() {
  await sendMsg(
    `🏛️ *AURELIO — Menú de Comandos Rápidos*\n\n` +
    `📊 *CONSULTAS*\n` +
    `📅 /agenda — Eventos y agenda próxima\n` +
    `📌 /tareas — Kanban: tareas pendientes\n` +
    `🛡️ /coraza — Tablero de Coraza Seguridad\n` +
    `🥩 /clientes — CRM de Chorizos\n` +
    `💰 /caja — Balance financiero real\n` +
    `📈 /negocios — Estrategia de tus negocios\n` +
    `🧠 /resumen — Briefing ejecutivo completo\n\n` +
    `✅ *ACCIONES*\n` +
    `✔️ /terminar [nombre] — Marcar tarea Done\n` +
    `✍️ /gasto [monto] [concepto] — Registrar gasto\n` +
    `🧘 /habito — Progreso de hábitos hoy\n` +
    `💪 /hecho [habito] — Marcar hábito completo\n` +
    `🔄 /sincronizar — CRM → Agenda auto\n\n` +
    `🎤 *VOZ O TEXTO LIBRE:*\n` +
    `_"Agenda reunión con proveedor mañana"_\n` +
    `_"¿Qué tareas de Coraza tengo pendientes?"_\n` +
    `_"Gasté 12000 en almuerzo"_`
  );
}

module.exports = { handleStartHelp };
