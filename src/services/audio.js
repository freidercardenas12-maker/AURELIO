const config = require('../config');
const logger = require('../utils/logger');
const { GEMINI_MODELS, makeRequest } = require('./gemini');

async function transcribeAudio(audioBuffer) {
  const payload = {
    contents: [{
      parts: [
        { inlineData: { mimeType: 'audio/ogg', data: audioBuffer.toString('base64') } },
        { text: 'Transcribe el texto en español de este audio. Responde ÚNICAMENTE con la transcripción exacta, sin saludos ni explicaciones.' }
      ]
    }]
  };

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`;
      const res = await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, payload);
      if (res.statusCode === 200 && res.body?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.body.candidates[0].content.parts[0].text.trim();
      }
      if (res.statusCode === 429) {
        logger.warn(`[Audio Transcribe 429] Model ${model} rate limited. Rotating...`);
        continue;
      }
      logger.error(`[Audio Transcribe] Model ${model} HTTP ${res.statusCode}`);
    } catch (e) {
      logger.error(`[Audio Transcribe] Error on model ${model}: ${e.message}`);
    }
  }

  throw new Error("No se pudo procesar el audio en este momento. Por favor reenvíalo o escríbelo en texto.");
}

module.exports = {
  transcribeAudio
};
