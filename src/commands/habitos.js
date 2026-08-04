const config = require('../config');
const { queryDB, patchPage } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { bool } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');

async function handleHabito() {
  const today = getTodayStr();
  const rows = await queryDB(config.HABITS_DB_ID);
  const row = rows.find(r => r.properties?.Fecha?.date?.start === today);

  if (!row) {
    await sendMsg('🧘 Sin registro de hábitos para hoy en Notion.');
    return;
  }

  const p = (key) => bool(row.properties?.[key]) ? '✅' : '❌';
  const prog = row.properties?.['Progreso Diario']?.formula?.string || '0%';

  await sendMsg(
    `🧘 *Hábitos de Hoy*\n\n` +
    `${p('Planificación Diaria')} Planificación Diaria\n` +
    `${p('Lectura Estoica (15 min)')} Lectura Estoica\n` +
    `${p('Ejercicio Físico')} Ejercicio Físico\n` +
    `${p('Código / Trabajo')} Código / Trabajo\n` +
    `${p('Revisión Nocturna')} Revisión Nocturna\n\n` +
    `📊 *Progreso:* \`${prog}\`\n\n` +
    `💡 Usa */hecho [habito]* para marcar.`
  );
}

async function handleHecho(text) {
  const input = text.split(' ').slice(1).join(' ').toLowerCase();
  const map = {
    'lectura': 'Lectura Estoica (15 min)', 'leer': 'Lectura Estoica (15 min)',
    'ejercicio': 'Ejercicio Físico', 'gym': 'Ejercicio Físico', 'entrenar': 'Ejercicio Físico',
    'planificacion': 'Planificación Diaria', 'plan': 'Planificación Diaria',
    'codigo': 'Código / Trabajo', 'programar': 'Código / Trabajo', 'trabajo': 'Código / Trabajo',
    'revision': 'Revisión Nocturna', 'noche': 'Revisión Nocturna'
  };

  const prop = map[input];
  if (!prop) {
    await sendMsg('⚠️ Hábito no reconocido.\n\nOpciones: `lectura`, `ejercicio`, `planificacion`, `codigo`, `revision`');
    return;
  }

  const today = getTodayStr();
  const rows = await queryDB(config.HABITS_DB_ID);
  const row = rows.find(r => r.properties?.Fecha?.date?.start === today);

  if (!row) {
    await sendMsg('❌ Sin registro de hábitos para hoy.');
    return;
  }

  const result = await patchPage(row.id, { [prop]: { checkbox: true } });
  if (result) {
    const prog = result.properties?.['Progreso Diario']?.formula?.string || '';
    await sendMsg(`💪 *¡Hábito completado!*\n\n✅ *${prop}*\n📊 Progreso: \`${prog}\``);
  } else {
    await sendMsg('❌ Error al marcar el hábito en Notion.');
  }
}

module.exports = { handleHabito, handleHecho };
