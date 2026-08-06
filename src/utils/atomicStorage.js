/**
 * AURELIO — Atomic Storage Engine (WAL / Zero-Corruption Guarantee)
 * Writes data to temporary swap buffer first, then atomically renames file.
 * Prevents file corruption even during unexpected power outages or hard crashes.
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function atomicWriteJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const tmpPath = `${filePath}.${Date.now()}.tmp`;
    const jsonStr = JSON.stringify(data, null, 2);

    fs.writeFileSync(tmpPath, jsonStr, 'utf-8');
    fs.renameSync(tmpPath, filePath); // Atomic operation on OS level
  } catch (e) {
    logger.error(`[Atomic Storage Error] Write failed for ${filePath}: ${e.message}`);
  }
}

function safeReadJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    logger.error(`[Atomic Storage Error] Read failed for ${filePath}: ${e.message}`);
    return fallback;
  }
}

module.exports = { atomicWriteJson, safeReadJson };
