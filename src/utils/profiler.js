/**
 * AURELIO — Microsecond Latency Profiler
 * Measures execution time for every pipeline stage (Notion, Gemini, TTS, Telegram).
 */
const logger = require('./logger');

class Profiler {
  constructor(label) {
    this.label = label;
    this.startMs = performance.now();
    this.marks = [];
  }

  mark(stage) {
    const elapsed = Math.round(performance.now() - this.startMs);
    this.marks.push({ stage, elapsedMs: elapsed });
    logger.info(`[PerfProfiler: ${this.label}] Stage "${stage}" completed at ${elapsed}ms`);
  }

  end() {
    const totalMs = Math.round(performance.now() - this.startMs);
    logger.info(`[PerfProfiler: ${this.label}] TOTAL execution time: ${totalMs}ms`);
    return { label: this.label, totalMs, marks: this.marks };
  }
}

module.exports = Profiler;
