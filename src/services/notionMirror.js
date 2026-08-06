/**
 * AURELIO — Notion Snapshot Mirror & Local Fallback Engine
 * Creates a complete local JSON snapshot of Notion databases every 10 minutes.
 * If Notion servers are down globally, Aurelio reads context directly from local disk.
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { queryDB } = require('./notion');
const logger = require('../utils/logger');

const MIRROR_FILE = path.join(__dirname, '../../data/notion_mirror.json');

function loadMirror() {
  try {
    if (!fs.existsSync(MIRROR_FILE)) return {};
    return JSON.parse(fs.readFileSync(MIRROR_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function saveMirror(data) {
  try {
    const dir = path.dirname(MIRROR_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MIRROR_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error(`[Notion Mirror Save Error]: ${e.message}`);
  }
}

/**
 * Take a full snapshot of all Notion databases
 */
async function updateNotionMirror() {
  logger.info('[Notion Mirror] Taking 10-minute snapshot of all Notion databases...');
  try {
    const snapshot = {
      timestamp: new Date().toISOString(),
      finances: await queryDB(config.FINANCES_DB_ID).catch(() => []),
      tasks: await queryDB(config.TASKS_DB_ID).catch(() => []),
      agenda: await queryDB(config.AGENDA_DB_ID).catch(() => []),
      crm: await queryDB(config.CRM_DB_ID).catch(() => []),
      coraza: await queryDB(config.CORAZA_DEV_DB_ID).catch(() => [])
    };

    saveMirror(snapshot);
    logger.info('[Notion Mirror] Snapshot saved successfully to data/notion_mirror.json');
  } catch (e) {
    logger.error(`[Notion Mirror Error]: ${e.message}`);
  }
}

/**
 * Read context from local mirror when Notion API is unreachable
 */
function readMirrorContext(type) {
  const mirror = loadMirror();
  if (!mirror.timestamp) return 'Sin espejo local disponible.';

  const lines = [`═══ REPLICA LOCAL DE RESPALDO (Notion Offline — Snapshot: ${mirror.timestamp.split('T')[1].slice(0,5)}) ═══`];

  if (type === 'CONSULTAR_FINANZAS' || type === 'CONSULTAR_TODO') {
    (mirror.finances || []).forEach(r => {
      lines.push(`• ${r.properties?.Concepto?.title?.[0]?.plain_text || 'Item'}: $${r.properties?.Monto?.number || 0}`);
    });
  }

  if (type === 'CONSULTAR_AGENDA' || type === 'CONSULTAR_TODO') {
    (mirror.agenda || []).forEach(e => {
      lines.push(`• ${e.properties?.Actividad?.title?.[0]?.plain_text || 'Evento'}: ${e.properties?.Fecha?.date?.start || 'Hoy'}`);
    });
  }

  return lines.join('\n');
}

module.exports = {
  updateNotionMirror,
  readMirrorContext,
  loadMirror
};
