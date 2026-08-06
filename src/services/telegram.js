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

function getCleanChatId() {
  return String(config.TELEGRAM_CHAT_ID || '').trim().replace(/['"]/g, '');
}

async function sendMsg(text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const formattedText = cleanMarkdownForTelegram(text);
  const chatId = getCleanChatId();
  const body = { chat_id: chatId, text: formattedText, parse_mode: 'Markdown' };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  try {
    const res = await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, body);
    if (res.statusCode === 200 && res.body?.result) {
      return res.body.result;
    }
    // Fallback without parse_mode if formatting error occurs
    const fallbackBody = { chat_id: chatId, text };
    if (replyMarkup) fallbackBody.reply_markup = replyMarkup;
    const res2 = await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, fallbackBody);
    return res2.body?.result || null;
  } catch (e) {
    logger.error(`[Telegram Service] Error sending message: ${e.message}`);
    return null;
  }
}

async function editMsgText(messageId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/editMessageText`;
  const formattedText = cleanMarkdownForTelegram(text);
  const chatId = getCleanChatId();
  const body = { chat_id: chatId, message_id: messageId, text: formattedText, parse_mode: 'Markdown' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  try {
    const res = await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, body);
    return res.statusCode === 200 && res.body?.ok;
  } catch (e) {
    logger.error(`[Telegram Edit Error]: ${e.message}`);
    return false;
  }
}

const EXECUTIVE_INLINE_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '📁 🥩 CHORIZOS', callback_data: 'cb_chorizos' },
      { text: '📁 🛡️ CORAZA CTA', callback_data: 'cb_coraza' }
    ],
    [
      { text: '📁 💰 FINANZAS', callback_data: 'cb_caja' },
      { text: '📁 📅 AGENDA', callback_data: 'cb_agenda' }
    ],
    [
      { text: '📁 📄 INFORME PDF', callback_data: 'cb_reporte' },
      { text: '📁 🟢 STATUS', callback_data: 'cb_status' }
    ]
  ]
};

async function sendMsgWithButtons(text, customKeyboard = null) {
  const keyboard = customKeyboard || EXECUTIVE_INLINE_KEYBOARD;
  await sendMsg(text, keyboard);
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, { callback_query_id: callbackQueryId, text });
  } catch (e) {
    logger.error(`[Telegram Callback Error]: ${e.message}`);
  }
}

async function pinChatMessage(messageId) {
  try {
    const chatId = getCleanChatId();
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/pinChatMessage`;
    await makeRequest(url, 'POST', { 'Content-Type': 'application/json' }, { chat_id: chatId, message_id: messageId, disable_notification: true });
  } catch (e) {
    logger.error(`[Telegram Pin Error]: ${e.message}`);
  }
}

async function sendVoiceNote(audioBuffer) {
  if (!audioBuffer) return;
  const chatId = getCleanChatId();
  return new Promise((resolve) => {
    try {
      const boundary = '----AurelioVoice' + Date.now();
      const payloadHeader = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
        `${chatId}\r\n` +
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

async function sendDocument(docBuffer, filename = 'informe_ejecutivo.pdf', caption = '') {
  if (!docBuffer) return;
  const chatId = getCleanChatId();
  return new Promise((resolve) => {
    try {
      const boundary = '----AurelioDoc' + Date.now();
      const payloadHeader = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
        `${chatId}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="caption"\r\n\r\n` +
        `${caption}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n` +
        `Content-Type: application/pdf\r\n\r\n`
      );
      const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
      const fullBody = Buffer.concat([payloadHeader, docBuffer, payloadFooter]);

      const options = {
        hostname: 'api.telegram.org',
        path: `/bot${config.TELEGRAM_BOT_TOKEN}/sendDocument`,
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
            logger.info(`✅ [Telegram Document] PDF sent successfully: ${filename}`);
          } else {
            logger.error(`[Telegram Document] sendDocument HTTP ${res.statusCode}: ${data.substring(0, 200)}`);
          }
          resolve();
        });
      });
      req.on('error', (e) => {
        logger.error(`[Telegram Document] sendDocument request error: ${e.message}`);
        resolve();
      });
      req.write(fullBody);
      req.end();
    } catch (e) {
      logger.error(`[Telegram Document] sendDocument exception: ${e.message}`);
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
    { command: 'reporte',     description: '📄 Generar Informe Ejecutivo en PDF' },
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

      if (update.callback_query) {
        const cb = update.callback_query;
        logger.info(`[Telegram Callback] Button pressed: ${cb.data}`);
        await answerCallbackQuery(cb.id, '🏛️ Procesando...');
        const cbMap = {
          'cb_reporte': '/reporte',
          'cb_agenda': '/agenda',
          'cb_caja': '/caja',
          'cb_chorizos': '/clientes',
          'cb_coraza': '/coraza',
          'cb_status': '/status'
        };
        const cmd = cbMap[cb.data] || '/ayuda';
        await onMessage(cmd);
        continue;
      }

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
  editMsgText,
  sendMsgWithButtons,
  sendVoiceNote,
  sendDocument,
  registerBotCommands,
  deleteWebhook,
  downloadFile,
  pollTelegram,
  answerCallbackQuery,
  pinChatMessage,
  makeRequest,
  EXECUTIVE_INLINE_KEYBOARD
};
