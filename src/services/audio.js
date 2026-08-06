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
  // Fallback to HuggingFace Whisper API if Gemini hits rate limit
  if (process.env.HUGGINGFACE_TOKEN) {
    try {
      logger.info('[Audio Transcribe] Gemini rate limited. Failing over to HuggingFace Whisper...');
      const hfUrl = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo';
      const hfRes = await makeRequest(hfUrl, 'POST', {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        'Content-Type': 'audio/ogg'
      }, audioBuffer);
      if (hfRes.body?.text) {
        logger.info(`[Audio Transcribe] HuggingFace Whisper success: "${hfRes.body.text}"`);
        return hfRes.body.text.trim();
      }
    } catch (e) {
      logger.warn(`[Audio Transcribe] HuggingFace fallback error: ${e.message}`);
    }
  }

  throw new Error("No se pudo procesar el audio en este momento. Por favor reenvíalo o escríbelo en texto.");
}

module.exports = {
  transcribeAudio
};
