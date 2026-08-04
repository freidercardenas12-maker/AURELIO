const https = require('https');
const config = require('../config');
const logger = require('../utils/logger');

let lastUpdateId = 0;

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

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function cleanMarkdownForTelegram(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gm, '▪ *$1*')
    .replace(/^## (.*$)/gm, '📌 *$1*')
    .replace(/^# (.*$)/gm, '🏛️ *$1*')
    .replace(/\*\*(.*?)\*\*/g, '*$1*');
}

async function sendMsg(text) {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const formattedText = cleanMarkdownForTelegram(text);
  const body = { chat_id: config.TELEGRAM_CHAT_ID, text: formattedText, parse_mode: 'Markdown' };
  try {
    const res = await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, body);
    if (res.statusCode !== 200) {
      // Fallback without parse_mode if formatting error occurs
      await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, { chat_id: config.TELEGRAM_CHAT_ID, text });
    }
  } catch (e) {
    logger.error(`[Telegram Service] Error sending message: ${e.message}`);
  }
}

async function sendVoiceNote(audioBuffer) {
  if (!audioBuffer) return;
  return new Promise((resolve) => {
    try {
      const boundary = '----AurelioVoice' + Date.now();
      const payloadHeader = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
        `${config.TELEGRAM_CHAT_ID}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="voice"; filename="aurelio.mp3"\r\n` +
        `Content-Type: audio/mpeg\r\n\r\n`
      );
      const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
      const fullBody = Buffer.concat([payloadHeader, audioBuffer, payloadFooter]);

      const options = {
        hostname: 'api.telegram.org',
        path: `/bot${config.TELEGRAM_BOT_TOKEN}/sendVoice`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBody.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            logger.info('✅ [TTS] Voice note sent to Telegram successfully.');
          } else {
            logger.error(`[TTS] sendVoice HTTP ${res.statusCode}: ${data.substring(0, 200)}`);
          }
          resolve();
        });
      });
      req.on('error', (e) => {
        logger.error(`[TTS] sendVoice request error: ${e.message}`);
        resolve();
      });
      req.write(fullBody);
      req.end();
    } catch (e) {
      logger.error(`[TTS] sendVoiceNote exception: ${e.message}`);
      resolve();
    }
  });
}

async function registerBotCommands() {
  const commands = [
    { command: 'resumen',     description: '🧠 Briefing ejecutivo del día' },
    { command: 'agenda',      description: '📅 Ver eventos y agenda próxima' },
    { command: 'tareas',      description: '📌 Kanban: tareas pendientes' },
    { command: 'coraza',      description: '🛡️ Tablero de Coraza Seguridad CTA' },
    { command: 'clientes',    description: '🥩 CRM de clientes Chorizos' },
    { command: 'caja',        description: '💰 Balance financiero real' },
    { command: 'negocios',    description: '📈 Estrategia de tus negocios' },
    { command: 'habito',      description: '🧘 Progreso de hábitos hoy' },
    { command: 'hecho',       description: '💪 Marcar hábito como completo' },
    { command: 'terminar',    description: '✅ Marcar tarea como Done' },
    { command: 'gasto',       description: '✍️ Registrar gasto en finanzas' },
    { command: 'sincronizar', description: '🔄 Sincronizar CRM → Agenda' },
    { command: 'ayuda',       description: '🏛️ Ver todos los comandos' }
  ];
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/setMyCommands`;
    const res = await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, { commands });
    if (res.body?.ok) {
      logger.info('✅ Menú de comandos registrado exitosamente en Telegram.');
    } else {
      logger.error(`[Telegram Commands] Error registering commands: ${JSON.stringify(res.body)}`);
    }
  } catch (e) {
    logger.error(`[Telegram Commands] Exception: ${e.message}`);
  }
}

async function deleteWebhook() {
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`;
    const res = await makeRequest(url, 'GET', {});
    if (res.body?.ok) {
      logger.info('✅ Telegram Webhook cleared for resilient long-polling.');
    }
  } catch (e) {
    logger.error(`[Telegram deleteWebhook Error]: ${e.message}`);
  }
}

async function pollTelegram(onMessage, onVoice, onPhoto) {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=3`;
  try {
    const res = await makeRequest(url, 'GET', {});
    if (res.statusCode !== 200) return;

    const configuredChatId = String(config.TELEGRAM_CHAT_ID || '').trim().replace(/['"]/g, '');

    for (const update of (res.body.result || [])) {
      lastUpdateId = update.update_id;
      const msg = update.message;
      if (!msg) continue;

      const incomingChatId = String(msg.chat?.id || '').trim();

      if (configuredChatId && incomingChatId !== configuredChatId) {
        logger.warn(`[Telegram Poll Ignore] Chat ID mismatch: incoming=${incomingChatId}, expected=${configuredChatId}`);
        continue;
      }

      if (msg.text) {
        logger.info(`[Telegram Bot] Text received: "${msg.text}"`);
        await onMessage(msg.text);
      } else if (msg.voice || msg.audio) {
        const audioObj = msg.voice || msg.audio;
        logger.info(`[Telegram Bot] Audio received: ${audioObj.file_id}`);
        await onVoice(audioObj.file_id);
      } else if (msg.photo && msg.photo.length > 0) {
        const largestPhoto = msg.photo[msg.photo.length - 1];
        const caption = msg.caption || '';
        logger.info(`[Telegram Bot] Photo received: ${largestPhoto.file_id}`);
        if (onPhoto) await onPhoto(largestPhoto.file_id, caption);
      }
    }
  } catch (e) {
    logger.error(`[Telegram Poll Error]: ${e.message}`);
  }
}

module.exports = {
  sendMsg,
  sendVoiceNote,
  downloadFile,
  registerBotCommands,
  pollTelegram,
  deleteWebhook,
  makeRequest
};
