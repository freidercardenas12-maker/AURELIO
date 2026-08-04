const https = require('https');
const config = require('../config');
const logger = require('../utils/logger');

const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

function makeRequest(url, method, headers, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function geminiCall(prompt) {
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`;
      const res = await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, {
        contents: [{ parts: [{ text: prompt }] }]
      });
      if (res.statusCode === 200 && res.body?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.body.candidates[0].content.parts[0].text.trim();
      }
      if (res.statusCode === 429) {
        logger.warn(`[Gemini Service] 429 Rate limit on model ${model}. Failing over to next model...`);
        continue;
      }
      logger.error(`[Gemini Service] Model ${model} returned HTTP ${res.statusCode}`);
    } catch (e) {
      logger.error(`[Gemini Service] Model ${model} error: ${e.message}`);
    }
  }
  return null;
}

async function geminiVisionCall(imageBuffer, promptText = 'Analiza esta imagen y describe detalladamente lo que ves o extrae la información relevante (recibos, facturas, documentos, notas o productos).') {
  const payload = {
    contents: [{
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } },
        { text: promptText }
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
        logger.warn(`[Gemini Vision] 429 Rate limit on model ${model}. Failing over...`);
        continue;
      }
      logger.error(`[Gemini Vision] Model ${model} returned HTTP ${res.statusCode}`);
    } catch (e) {
      logger.error(`[Gemini Vision] Model ${model} error: ${e.message}`);
    }
  }
  return null;
}

module.exports = {
  geminiCall,
  geminiVisionCall,
  GEMINI_MODELS,
  makeRequest
};
