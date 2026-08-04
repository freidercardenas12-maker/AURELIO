const { EdgeTTS, Constants } = require('@andresaya/edge-tts');
const logger = require('../utils/logger');

// ─── MÁXIMA CALIDAD DE AUDIO ───────────────────────────────
const OUTPUT_FORMAT = Constants.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3;

/**
 * Convierte un número a español hablado (ej: 1299809 → "1 millón 299 mil 809")
 */
function numberToSpokenSpanish(n) {
  if (isNaN(n) || n <= 0) return String(n);
  if (n >= 1000000) {
    const millones = Math.floor(n / 1000000);
    const resto = n % 1000000;
    const miles = Math.floor(resto / 1000);
    const unidades = resto % 1000;
    let s = millones === 1 ? '1 millón de' : `${millones} millones de`;
    if (miles > 0) s += ` ${miles} mil`;
    if (unidades > 0) s += ` ${unidades}`;
    return s;
  } else if (n >= 1000) {
    const miles = Math.floor(n / 1000);
    const unidades = n % 1000;
    let s = `${miles} mil`;
    if (unidades > 0) s += ` ${unidades}`;
    return s;
  }
  return String(n);
}

/**
 * Limpia el texto para que la red neuronal de voz lo pronuncie
 * de forma 100% humana, sin trabas ni artefactos sonoros.
 */
function cleanTextForSpeech(text) {
  if (!text) return '';
  let clean = text
    // 1. Eliminar emojis completamente
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    // 2. Eliminar URLs
    .replace(/https?:\/\/\S+/g, '')
    // 3. Eliminar TODO el markdown primero
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[•▪📌]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 4. Convertir montos COP a español hablado
  // Patron: $1.299.809 COP o $52.000 COP o $1.000.000 o solo números con puntos de miles
  clean = clean.replace(/\$\s*(\d[\d.]*)\s*(?:COP|pesos colombianos|pesos)?/gi, (match, numStr) => {
    const n = parseInt(numStr.replace(/\./g, ''), 10);
    if (isNaN(n)) return match;
    return numberToSpokenSpanish(n) + ' pesos colombianos';
  });
  // Limpiar $ sueltos
  clean = clean.replace(/\$/g, '');

  clean = clean
    // 5. Convertir separadores de sección en pausas naturales
    .replace(/[═╗╔║╚╝─┐├┤┘└│┌]+/g, '. ')
    .replace(/[-–—]{2,}/g, '. ')
    // 6. Saltos de línea → pausas con punto
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    // 7. Limpiar espacios múltiples
    .replace(/\s{2,}/g, ' ')
    // 8. Eliminar puntos o comas consecutivos
    .replace(/[.,]{2,}/g, '.')
    .replace(/\.\s*,/g, '.')
    .replace(/,\s*\./g, '.')
    .trim();

  if (clean && !/[.!?]$/.test(clean)) clean += '.';
  return clean;
}

/**
 * Genera un buffer de audio MP3 de MÁXIMA calidad usando la voz neuronal
 * masculina colombiana es-CO-GonzaloNeural de Microsoft Edge.
 *
 * Prosodia optimizada para sonar ejecutivo y natural:
 * - Rate: -5% (ligeramente más lento = más claro y natural)
 * - Pitch: -2Hz (tono ligeramente más grave = más autoridad)
 * - Volume: +10% (más audible sin distorsión)
 * - Output: 96kbps (máxima calidad disponible)
 */
async function generateSpeechBuffer(text) {
  try {
    const speakableText = cleanTextForSpeech(text);
    if (!speakableText || speakableText.length < 5) return null;

    logger.info(`[TTS Service] Synthesizing HD male voice (${speakableText.length} chars, 96kbps)...`);

    const tts = new EdgeTTS({
      voice: 'es-CO-GonzaloNeural',
      lang: 'es-CO',
      rate: '-5%',
      pitch: '-2Hz',
      volume: '+10%',
      outputFormat: OUTPUT_FORMAT
    });

    await tts.synthesize(speakableText, 'es-CO-GonzaloNeural');
    const buffer = tts.toBuffer();

    if (buffer && buffer.length > 0) {
      const durationEstimate = Math.round(buffer.length / (96000 / 8));
      logger.info(`[TTS Service] HD voice generated: ${buffer.length} bytes (~${durationEstimate}s)`);
      return buffer;
    }
    return null;
  } catch (e) {
    logger.error(`[TTS Service Error]: ${e.message}`);
    return null;
  }
}

module.exports = { generateSpeechBuffer, cleanTextForSpeech };
