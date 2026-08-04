const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const MEMORY_FILE = path.join(__dirname, '../../memory_store.json');
const MAX_HISTORY = 10; // Keep last 10 messages

let history = [];

// Load existing memory from file on startup
try {
  if (fs.existsSync(MEMORY_FILE)) {
    const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
    history = JSON.parse(raw);
    logger.info(`[Memory Service] Loaded ${history.length} historical conversation turns.`);
  }
} catch (e) {
  logger.error(`[Memory Service] Error loading memory file: ${e.message}`);
  history = [];
}

function saveMemory() {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (e) {
    logger.error(`[Memory Service] Error saving memory file: ${e.message}`);
  }
}

/**
 * Adds a new user-bot message pair to memory.
 */
function addMessage(userMessage, botReply) {
  history.push({
    timestamp: new Date().toISOString(),
    user: userMessage,
    aurelio: botReply
  });

  // Keep only the last MAX_HISTORY entries
  if (history.length > MAX_HISTORY) {
    history = history.slice(-MAX_HISTORY);
  }

  saveMemory();
}

/**
 * Returns formatted recent conversation history string for LLM context.
 */
function getMemoryContext() {
  if (history.length === 0) return '';

  let context = '════ HISTORIAL DE CONVERSACIÓN RECIENTE ════\n';
  for (const turn of history) {
    context += `• Freider: "${turn.user}"\n`;
    context += `  Aurelio: "${turn.aurelio}"\n\n`;
  }
  context += '═════════════════════════════════════════════\n';
  return context;
}

/**
 * Clears memory store
 */
function clearMemory() {
  history = [];
  saveMemory();
  logger.info('[Memory Service] Conversation memory cleared.');
}

module.exports = {
  addMessage,
  getMemoryContext,
  clearMemory
};
