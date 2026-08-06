/**
 * AURELIO — Intelligent Conversation Memory Module
 * Maintains structured per-session context across conversations
 * so Aurelio remembers what was discussed and can reference it.
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const MEMORY_FILE = path.join(__dirname, '../../data/session_memory.json');

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return { topics: [], lastSeen: null, pendingFollowups: [] };
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
  } catch (e) {
    return { topics: [], lastSeen: null, pendingFollowups: [] };
  }
}

function saveMemory(data) {
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error(`[Session Memory] Save error: ${e.message}`);
  }
}

/**
 * Record a new topic or event into session memory
 */
function recordTopic(text, intent) {
  const mem = loadMemory();
  mem.lastSeen = new Date().toISOString();

  // Keep up to 20 recent topics
  mem.topics.unshift({ text: text.slice(0, 120), intent, ts: new Date().toISOString() });
  if (mem.topics.length > 20) mem.topics = mem.topics.slice(0, 20);

  // Auto-detect follow-up needs
  if (/pend|falta|olv|recordar|luego|despues|después/i.test(text)) {
    mem.pendingFollowups.push({ text: text.slice(0, 80), ts: new Date().toISOString() });
    if (mem.pendingFollowups.length > 5) mem.pendingFollowups = mem.pendingFollowups.slice(0, 5);
  }

  saveMemory(mem);
}

/**
 * Get a brief memory summary string for Gemini system prompt injection
 */
function getMemorySummary() {
  const mem = loadMemory();
  if (!mem.topics || mem.topics.length === 0) return '';

  const recent = mem.topics.slice(0, 5).map((t, i) => `  ${i + 1}. [${t.intent}] "${t.text}"`).join('\n');
  const followups = mem.pendingFollowups.length > 0
    ? `\nTemas pendientes de seguimiento:\n${mem.pendingFollowups.map(f => `  • "${f.text}"`).join('\n')}`
    : '';

  return `\n\n[MEMORIA DE SESIÓN — Conversaciones recientes con Freider]\n${recent}${followups}`;
}

module.exports = { recordTopic, getMemorySummary, loadMemory };
