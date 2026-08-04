const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'production',

  // TELEGRAM
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,

  // NOTION
  NOTION_TOKEN: process.env.NOTION_TOKEN,
  TASKS_DB_ID: process.env.TASKS_DB_ID,
  FINANCES_DB_ID: process.env.FINANCES_DB_ID,
  HABITS_DB_ID: process.env.HABITS_DB_ID,
  CRM_DB_ID: process.env.CRM_DB_ID,
  AGENDA_DB_ID: process.env.AGENDA_DB_ID,
  ESTRATEGIA_DB_ID: process.env.ESTRATEGIA_DB_ID,
  HORARIO_DB_ID: process.env.HORARIO_DB_ID,
  BIBLIOTECA_DB_ID: process.env.BIBLIOTECA_DB_ID,
  SPRINTS_DB_ID: process.env.SPRINTS_DB_ID,
  CORAZA_DEV_DB_ID: process.env.CORAZA_DEV_DB_ID,
  CORAZA_WIKI_DB_ID: process.env.CORAZA_WIKI_DB_ID,
  NOTAS_PAGE_ID: process.env.NOTAS_PAGE_ID,

  // AI & TRANSCRIPTION
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN,
};

// Validar variables requeridas
const requiredKeys = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'NOTION_TOKEN', 'GEMINI_API_KEY'];
const missing = requiredKeys.filter(key => !config[key]);

if (missing.length > 0) {
  throw new Error(`[Config Error] Missing required environment variables in .env: ${missing.join(', ')}`);
}

module.exports = config;
