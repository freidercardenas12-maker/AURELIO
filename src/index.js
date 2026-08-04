const SimpleQueue = require('./utils/queue');
const config = require('./config');
const logger = require('./utils/logger');
const { registerBotCommands, pollTelegram, downloadFile, sendMsg, sendVoiceNote, makeRequest } = require('./services/telegram');
const { detectIntent } = require('./core/intent');
const { geminiChat } = require('./core/chat');
const { geminiVisionCall } = require('./services/gemini');
const { transcribeAudio } = require('./services/audio');
const { generateSpeechBuffer } = require('./services/tts');
const { handleCommand } = require('./commands');
const { createPage } = require('./services/notion');
const { createReceiptEntry } = require('./services/notion-attachments');
const { generateCalendarLink } = require('./services/calendar');
const { startJobs, morningBriefing, syncCRM } = require('./jobs/scheduler');

// SimpleQueue for sequential message processing (zero race conditions, 100% CJS compatible)
const messageQueue = new SimpleQueue(1);

// Express App for health monitoring & webhooks
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Aurelio Bot v2.0 — 10/10 PERFECTO',
    uptime: Math.floor(process.uptime()),
    capabilities: ['text', 'voice', 'vision', 'tts', 'whatsapp', 'calendar', 'notion-attachments', 'memory', 'webhook'],
    timestamp: new Date().toISOString()
  });
});

// Production Webhook endpoint for Telegram
app.post('/webhook', (req, res) => {
  res.sendStatus(200);
  const update = req.body;
  if (!update || !update.message) return;
  const msg = update.message;
  if (msg.chat.id.toString() !== config.TELEGRAM_CHAT_ID) return;

  if (msg.text) {
    messageQueue.add(() => processTextMessage(msg.text, false));
  } else if (msg.voice || msg.audio) {
    const fileId = (msg.voice || msg.audio).file_id;
    messageQueue.add(() => processVoiceMessage(fileId));
  } else if (msg.photo && msg.photo.length > 0) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    messageQueue.add(() => processPhotoMessage(fileId, msg.caption || ''));
  }
});

app.listen(config.PORT, () => {
  logger.info(`🚀 [Aurelio Server] Active on port ${config.PORT} (Health Check & Webhook ready)`);
});



async function processTextMessage(text, respondWithVoice = false) {
  if (text.startsWith('/')) {
    await handleCommand(text, { morningBriefing, syncCRM });
    return;
  }

  const intent = await detectIntent(text);
  logger.info(`[Intent Classifier] Detected: ${intent.i}`);

  if (intent.i === 'CREAR_TAREA' && intent.tarea) {
    const created = await createPage(config.TASKS_DB_ID, {
      'Tarea': { title: [{ text: { content: intent.tarea } }] },
      'Estado': { status: { name: 'To Do' } },
      'Fecha de Entrega': { date: { start: intent.fecha } }
    });
    const reply = created
      ? `✅ *Tarea Creada en Notion*\n📌 *${intent.tarea}*\n📆 Entrega: ${intent.fecha}`
      : '❌ Error al crear la tarea en Notion.';
    await sendMsg(reply);
    return;
  }

  if (intent.i === 'CREAR_AGENDA' && intent.actividad) {
    const created = await createPage(config.AGENDA_DB_ID, {
      'Actividad': { title: [{ text: { content: intent.actividad } }] },
      'Fecha': { date: { start: intent.fecha } },
      'Estado': { select: { name: 'Pendiente' } }
    });

    if (created) {
      const calLink = generateCalendarLink(
        intent.actividad,
        intent.fecha,
        intent.fecha,
        `Agendado por Aurelio el ${new Date().toLocaleDateString('es-CO')}`
      );
      await sendMsg(
        `📆 *Evento Agendado en Notion*\n📌 *${intent.actividad}*\n📅 Fecha: ${intent.fecha}\n\n📅 [Agregar a Google Calendar](${calLink})`
      );
    } else {
      await sendMsg('❌ Error al agendar en Notion.');
    }
    return;
  }

  if (intent.i === 'CREAR_GASTO' && intent.monto) {
    const created = await createPage(config.FINANCES_DB_ID, {
      'Concepto': { title: [{ text: { content: intent.concepto || 'Gasto registrado' } }] },
      'Monto': { number: intent.monto },
      'Tipo': { select: { name: 'Gasto Fijo' } },
      'Estado': { select: { name: 'Pagado' } },
      'Fecha de Vencimiento': { date: { start: new Date().toISOString().split('T')[0] } }
    });
    const reply = created
      ? `💸 *Gasto Registrado en Notion*\n✍️ ${intent.concepto || 'Gasto'}\n💰 $${intent.monto.toLocaleString('es-CO')} COP`
      : '❌ Error al registrar gasto.';
    await sendMsg(reply);
    return;
  }

  // Conversación libre — responder con texto y (si vino de voz) también con nota de voz
  const reply = await geminiChat(text, intent.i);
  await sendMsg(reply);

  // Si el mensaje vino de nota de voz, responder también con voz
  if (respondWithVoice) {
    const speechBuffer = await generateSpeechBuffer(reply);
    if (speechBuffer) {
      await sendVoiceNote(speechBuffer);
    }
  }
}

async function processVoiceMessage(fileId) {
  try {
    await sendMsg('🎙️ *Escuchando nota de voz...*');
    const getFileUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileRes = await makeRequest(getFileUrl, 'GET', {});

    if (fileRes.statusCode !== 200 || !fileRes.body?.result?.file_path) {
      await sendMsg('❌ Error al obtener el archivo de voz de Telegram.');
      return;
    }

    const downloadUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${fileRes.body.result.file_path}`;
    const audioBuffer = await downloadFile(downloadUrl);
    const transcript = await transcribeAudio(audioBuffer);

    await sendMsg(`🗣️ *Transcripción:* _"${transcript}"_`);

    // respondWithVoice = true → Aurelio responde también con nota de voz
    await processTextMessage(transcript, true);
  } catch (e) {
    logger.error(`[Voice Processing Error]: ${e.message}`);
    await sendMsg(`❌ ${e.message}`);
  }
}

async function processPhotoMessage(fileId, caption) {
  try {
    await sendMsg('👁️ *Analizando imagen con Gemini Vision...*');
    const getFileUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileRes = await makeRequest(getFileUrl, 'GET', {});

    if (fileRes.statusCode !== 200 || !fileRes.body?.result?.file_path) {
      await sendMsg('❌ Error al obtener la imagen de Telegram.');
      return;
    }

    const downloadUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${fileRes.body.result.file_path}`;
    const imageBuffer = await downloadFile(downloadUrl);

    // Detect if receipt/invoice to auto-register in Notion Finances
    const isReceipt = caption && /recibo|factura|gasto|pago|compra/i.test(caption);

    const promptText = isReceipt
      ? `Analiza este recibo o factura. Extrae: 1) Concepto o descripción del gasto. 2) Monto total en COP o USD. 3) Fecha. Responde en formato JSON: {"concepto": "...", "monto": 45000, "fecha": "2026-08-03"}`
      : caption
        ? `El usuario envió una imagen con el comentario: "${caption}". Analízala como Aurelio, su asistente ejecutivo estoico, y responde de forma útil y directa.`
        : `Analiza esta imagen. Si es un recibo o factura extrae el concepto y monto total. Si es un documento resúmelo. Si es un tablero de tareas lista las actividades. Responde de forma directa y ejecutiva.`;

    const visionReply = await geminiVisionCall(imageBuffer, promptText);

    if (isReceipt && visionReply) {
      try {
        const cleaned = visionReply.replace(/```json|```/g, '').trim();
        const match = cleaned.match(/\{.*\}/s);
        if (match) {
          const data = JSON.parse(match[0]);
          if (data.concepto && data.monto) {
            const imageDesc = `${data.concepto} — $${data.monto.toLocaleString('es-CO')} COP | Foto adjunta vía Telegram`;
            const created = await createReceiptEntry(data.concepto, data.monto, imageDesc);
            if (created) {
              await sendMsg(
                `🧾 *Recibo Registrado y Archivado en Notion*\n\n` +
                `✍️ *${data.concepto}*\n` +
                `💸 *$${Number(data.monto).toLocaleString('es-CO')} COP*\n` +
                `📅 ${data.fecha || 'Hoy'}\n\n` +
                `📎 _Descripción del comprobante guardada en tu base de Finanzas._`
              );
              return;
            }
          }
        }
      } catch (_) {}
    }

    await sendMsg(visionReply || '📷 Imagen recibida, pero no pude extraer información clara de ella.');
  } catch (e) {
    logger.error(`[Photo Processing Error]: ${e.message}`);
    await sendMsg(`❌ Error procesando la imagen: ${e.message}`);
  }
}

// ─── INICIO ───────────────────────────────────────────────────
async function main() {
  logger.info('🏛️ [Aurelio Bot v2.0 — 10/10] Initializing all systems...');

  await registerBotCommands();
  startJobs();

  setInterval(() => {
    pollTelegram(
      (text)              => messageQueue.add(() => processTextMessage(text, false)),
      (fileId)            => messageQueue.add(() => processVoiceMessage(fileId)),
      (fileId, caption)   => messageQueue.add(() => processPhotoMessage(fileId, caption))
    );
  }, 1500);

  logger.info('✅ [Aurelio Bot 10/10 PERFECTO] Text + Male Neural Voice + Vision + TTS + WhatsApp + Calendar + Memory Store + Notion Attachments — ALL ACTIVE.');
}

main().catch(err => {
  logger.error(`[Fatal Startup Error]: ${err.message}`, { stack: err.stack });
});
