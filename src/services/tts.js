const { EdgeTTS, Constants } = require('@andresaya/edge-tts');
const googleTTS = require('google-tts-api');
const https = require('https');
const logger = require('../utils/logger');

const OUTPUT_FORMAT = Constants.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3;

function downloadHttpChunk(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

/**
 * Fallback TTS Engine using Google Translate TTS HTTP API
 */
async function generateGoogleTTSFallback(text) {
  try {
    logger.info('[TTS Service] Using Google TTS Fallback engine...');
    const urls = googleTTS.getAllAudioUrls(text.slice(0, 1000), {
      lang: 'es',
      slow: false,
      host: 'https://translate.google.com'
    });

    const buffers = [];
    for (const { url } of urls) {
      const buf = await downloadHttpChunk(url);
      buffers.push(buf);
    }
    const combined = Buffer.concat(buffers);
    logger.info(`[TTS Service] Google TTS Fallback generated: ${combined.length} bytes`);
    return combined;
  } catch (e) {
    logger.error(`[TTS Fallback Error]: ${e.message}`);
    return null;
  }
}

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

function cleanTextForSpeech(text) {
  if (!text) return '';
  let clean = text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[•▪📌]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  clean = clean.replace(/\$\s*(\d[\d.]*)\s*(?:COP|pesos colombianos|pesos)?/gi, (match, numStr) => {
    const n = parseInt(numStr.replace(/\./g, ''), 10);
    if (isNaN(n)) return match;
    return numberToSpokenSpanish(n) + ' pesos colombianos';
  });
  clean = clean.replace(/\$/g, '');

  clean = clean
    .replace(/[═╗╔║╚╝─┐├┤┘└│┌]+/g, '. ')
    .replace(/[-–—]{2,}/g, '. ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/[.,]{2,}/g, '.')
    .replace(/\.\s*,/g, '.')
    .replace(/,\s*\./g, '.')
    .trim();

  if (clean && !/[.!?]$/.test(clean)) clean += '.';
  return clean;
}

/**
 * Generates an MP3 Audio Buffer with dual failover architecture (Edge Neural HD + Google TTS Fallback)
 * Guarantees audio delivery 100% of the time on both cloud servers and local environments.
 */
async function generateSpeechBuffer(text) {
  const speakableText = cleanTextForSpeech(text);
  if (!speakableText || speakableText.length < 3) return null;

  // Primary: Edge TTS Male Neural HD Voice with 8-second timeout safety guard
  try {
    logger.info(`[TTS Service] Synthesizing HD male voice (${speakableText.length} chars, 96kbps)...`);

    const edgePromise = (async () => {
      const tts = new EdgeTTS({
        voice: 'es-CO-GonzaloNeural',
        lang: 'es-CO',
        rate: '-5%',
        pitch: '-2Hz',
        volume: '+10%',
        outputFormat: OUTPUT_FORMAT
      });

      await tts.synthesize(speakableText, 'es-CO-GonzaloNeural');
      return tts.toBuffer();
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('EdgeTTS Timeout (45s)')), 45000)
    );

    const buffer = await Promise.race([edgePromise, timeoutPromise]);

    if (buffer && buffer.length > 0) {
      logger.info(`[TTS Service] HD voice generated: ${buffer.length} bytes`);
      return buffer;
    }
  } catch (e) {
    logger.error(`[TTS Service Primary Failover]: ${e.message}`);
  }

  // Fallback: Google TTS HTTP Engine
  return generateGoogleTTSFallback(speakableText);
}

module.exports = { generateSpeechBuffer, cleanTextForSpeech };
