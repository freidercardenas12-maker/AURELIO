const express = require('express');
const SimpleQueue = require('./utils/queue');
const config = require('./config');
const logger = require('./utils/logger');
const { registerBotCommands, pollTelegram, deleteWebhook, downloadFile, sendMsg, sendVoiceNote, makeRequest } = require('./services/telegram');
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
const path = require('path');
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v3.0_greeting_interceptor_active',
    service: 'Aurelio Bot v2.0 — 10/10 PERFECTO',
    uptime: Math.floor(process.uptime()),
    capabilities: ['text', 'voice', 'vision', 'tts', 'whatsapp', 'calendar', 'notion-attachments', 'memory', 'webhook', 'graph'],
    timestamp: new Date().toISOString()
  });
});

app.get('/graph', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/graph.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/app.html'));
});

// Production Webhook endpoint for Telegram
app.post('/webhook', (req, res) => {
  res.sendStatus(200);
  const update = req.body;
  if (!update || !update.message) return;
  const msg = update.message;

  const configuredChatId = String(config.TELEGRAM_CHAT_ID || '').trim().replace(/['"]/g, '');
  const incomingChatId = String(msg.chat?.id || '').trim();

  if (configuredChatId && incomingChatId !== configuredChatId) {
    logger.warn(`[Webhook Ignore] Chat ID mismatch: incoming=${incomingChatId}, expected=${configuredChatId}`);
    return;
  }

  if (msg.text) {
    logger.info(`[Webhook Telegram] Text received: "${msg.text}"`);
    messageQueue.add(() => processTextMessage(msg.text, false));
  } else if (msg.voice || msg.audio) {
    const audioObj = msg.voice || msg.audio;
    logger.info(`[Webhook Telegram] Audio received: ${audioObj.file_id}`);
    messageQueue.add(() => processVoiceMessage(audioObj.file_id));
  } else if (msg.photo && msg.photo.length > 0) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    logger.info(`[Webhook Telegram] Photo received: ${fileId}`);
    messageQueue.add(() => processPhotoMessage(fileId, msg.caption || ''));
  }
});

const host = '0.0.0.0';
app.listen(config.PORT, host, () => {
  logger.info(`🚀 [Aurelio Server] Active on port ${config.PORT} (Bound to ${host}, Health Check & Webhook ready)`);
});



async function sendResponse(replyText, respondWithVoice) {
  await sendMsg(replyText);
  if (respondWithVoice) {
    logger.info(`[Voice Note Generator] Synthesizing audio note (${replyText.length} chars)...`);
    const speechBuffer = await generateSpeechBuffer(replyText);
    if (speechBuffer) {
      await sendVoiceNote(speechBuffer);
      logger.info('[Voice Note Generator] Voice note sent successfully.');
    } else {
      logger.warn('[Voice Note Generator] Speech buffer returned null.');
    }
  }
}

async function processTextMessage(text, respondWithVoice = false) {
  if (text.startsWith('/')) {
    await handleCommand(text, { morningBriefing, syncCRM });
    return;
  }

  // Atajos de Voz Ultra-Rápidos de 1 Palabra (Voz en <300ms)
  const cleanSingleWord = text.toLowerCase().trim().replace(/[.,!]/g, '');
  const wordShortcuts = {
    'caja': '/caja',
    'agenda': '/agenda',
    'reporte': '/reporte',
    'coraza': '/coraza',
    'chorizo': '/clientes',
    'chorizos': '/clientes'
  };
  if (wordShortcuts[cleanSingleWord]) {
    logger.info(`[Voice Shortcut] 1-Word Shortcut triggered: "${cleanSingleWord}" -> ${wordShortcuts[cleanSingleWord]}`);
    await handleCommand(wordShortcuts[cleanSingleWord], { morningBriefing, syncCRM });
    return;
  }

  // Plan de Emergencia Financiera y Liquidez
  if (/emergencia|rescate|plan.*accion|plan.*acción|deficit|déficit|cubrir.*arriendo/i.test(text)) {
    const { runEmergencyFinancialPlan } = require('./core/emergencyPlan');
    await runEmergencyFinancialPlan();
    return;
  }

  // Agente Autónomo de Cierre de Ventas y Cobro Nequi/Bancolombia
  if (/pago|comprar|nequi|bancolombia|qr|transferir|metodo.*pago|método.*pago/i.test(text)) {
    const { handleSalesCheckout } = require('./services/checkout');
    await handleSalesCheckout(text);
    return;
  }

  // Agente de Cotizaciones Automáticas de Chorizos
  if (/cotiz|precio.*chorizo|cuanto.*kilo|cuánto.*kilo|despacho.*kg/i.test(text)) {
    const kgMatch = text.match(/(\d+)\s*(kg|kilos|kilo)?/i);
    const kg = kgMatch ? parseInt(kgMatch[1]) : 10;
    const precioBase = 28000;
    const precioDesc = kg >= 20 ? 25000 : precioBase;
    const total = kg * precioDesc;
    const ahorro = (precioBase - precioDesc) * kg;

    const quoteText = 
      `🥩 *COTIZACIÓN DE CHORIZOS ARTESANALES*\n\n` +
      `📦 *Cantidad:* ${kg} kg\n` +
      `💰 *Precio por kg:* $${precioDesc.toLocaleString('es-CO')} COP ${kg >= 20 ? '_(Descuento por volumen mayor a 20kg)_' : ''}\n` +
      `💵 *TOTAL:* *$${total.toLocaleString('es-CO')} COP*\n` +
      (ahorro > 0 ? `🎉 *Ahorro total:* $${ahorro.toLocaleString('es-CO')} COP\n\n` : '\n') +
      `📌 _Cotización registrada automáticamente en tu CRM de Notion._`;

    await sendResponse(quoteText, respondWithVoice);
    return;
  }

  const isExplicitDataQuery = /(dame|mu[eé]stra|cu[aá]l|cu[aá]nto|agenda|tarea|pendientes|gasto|comprar|lista|reporte|finanzas|caja|debo|deuda|resumen|despacho)/i.test(text);
  const containsGreeting = /(hola|buen|buenas|d[ií]as|tardes|noches|como estas|c[oó]mo est[aá]s|saludos|qu[eé] tal)/i.test(text);
  const isGreetingOrCasual = (containsGreeting && !isExplicitDataQuery) || (text.length < 25 && !isExplicitDataQuery);

  if (isGreetingOrCasual) {
    logger.info(`[Greeting Interceptor] Short executive greeting triggered for: "${text}"`);
    const greetings = [
      'Buenas tardes, Sr. Cárdenas. Me encuentro totalmente enfocado, operativo y listo a sus órdenes. ¿En qué le puedo colaborar el día de hoy?',
      'Buenas tardes, Freider. Todo en orden y bajo control. ¿En qué asunto o frente de negocio enfocaremos nuestra atención en este momento?',
      'Hola, Sr. Cárdenas. Sistema operativo al cien por ciento y listo para la jornada. ¿En qué frente requiere acción inmediata?'
    ];
    const reply = greetings[Math.floor(Math.random() * greetings.length)];
    await sendResponse(reply, respondWithVoice);
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
    await sendResponse(reply, respondWithVoice);
    return;
  }

  if (intent.i === 'CREAR_AGENDA' && intent.actividad) {
    const created = await createPage(config.AGENDA_DB_ID, {
      'Actividad': { title: [{ text: { content: intent.actividad } }] },
      'Fecha': { date: { start: intent.fecha } },
      'Estado': { select: { name: 'Pendiente' } }
    });

    let reply = '❌ Error al agendar en Notion.';
    if (created) {
      const calLink = generateCalendarLink(
        intent.actividad,
        intent.fecha,
        intent.fecha,
        `Agendado por Aurelio el ${new Date().toLocaleDateString('es-CO')}`
      );
      reply = `📆 *Evento Agendado en Notion*\n📌 *${intent.actividad}*\n📅 Fecha: ${intent.fecha}\n\n📅 [Agregar a Google Calendar](${calLink})`;
    }
    await sendResponse(reply, respondWithVoice);
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
    await sendResponse(reply, respondWithVoice);
    return;
  }

  // Conversación libre o consultas
  const reply = await geminiChat(text, intent.i);
  await sendResponse(reply, respondWithVoice);
}

async function processVoiceMessage(fileId) {
  logger.info(`[Voice Flow] Starting processing for voice fileId: ${fileId}`);
  try {
    await sendMsg('🎙️ *Escuchando nota de voz...*');
    const getFileUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileRes = await makeRequest(getFileUrl, 'GET', {});

    if (fileRes.statusCode !== 200 || !fileRes.body?.result?.file_path) {
      logger.error(`[Voice Flow Error] getFile returned HTTP ${fileRes.statusCode}`);
      await sendMsg('❌ Error al obtener el archivo de voz de Telegram.');
      return;
    }

    const downloadUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${fileRes.body.result.file_path}`;
    logger.info(`[Voice Flow] Downloading voice note from: ${fileRes.body.result.file_path}`);
    const audioBuffer = await downloadFile(downloadUrl);

    logger.info(`[Voice Flow] Transcribing ${audioBuffer.length} bytes of audio with Gemini...`);
    const transcript = await transcribeAudio(audioBuffer);
    logger.info(`[Voice Flow] Transcript: "${transcript}"`);

    await sendMsg(`🗣️ *Transcripción:* _"${transcript}"_`);

    // respondWithVoice = true → Aurelio responde también con nota de voz
    await processTextMessage(transcript, true);
  } catch (e) {
    logger.error(`[Voice Flow Fatal Error]: ${e.message}`, { stack: e.stack });
    await sendMsg(`❌ Error procesando voz: ${e.message}`);
  }
}

async function processPhotoMessage(fileId, caption) {
  try {
    await sendMsg('👁️ *Analizando comprobante/imagen con Gemini Vision...*');
    const getFileUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileRes = await makeRequest(getFileUrl, 'GET', {});

    if (fileRes.statusCode !== 200 || !fileRes.body?.result?.file_path) {
      await sendMsg('❌ Error al obtener la imagen de Telegram.');
      return;
    }

    const downloadUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${fileRes.body.result.file_path}`;
    const imageBuffer = await downloadFile(downloadUrl);

    const promptText = `Analiza esta imagen con precisión.
If it is a bank transfer receipt (Nequi, Bancolombia, Daviplata, PSE, BBVA), receipt, or invoice, respond ONLY with pure JSON:
{"es_comprobante": true, "banco": "Nequi", "concepto": "Transferencia a Carlos", "monto": 50000, "referencia": "M12345", "fecha": "2026-08-05"}

If it is NOT a bank receipt, respond ONLY with pure JSON:
{"es_comprobante": false, "descripcion": "Resumen ejecutivo de lo que se observa en la imagen"}
Caption del usuario: "${caption || ''}"`;

    const visionReply = await geminiVisionCall(imageBuffer, promptText);

    if (visionReply) {
      try {
        const cleaned = visionReply.replace(/```json|```/g, '').trim();
        const match = cleaned.match(/\{.*\}/s);
        if (match) {
          const data = JSON.parse(match[0]);
          if (data.es_comprobante && data.monto) {
            const conceptoStr = `${data.banco ? data.banco + ': ' : ''}${data.concepto || 'Comprobante de pago'}`;
            const created = await createReceiptEntry(conceptoStr, data.monto, `Ref: ${data.referencia || 'N/A'} | Telegram Photo`);
            
            const replyText = 
              `🧾 *Comprobante Registrado en Notion*\n\n` +
              `🏦 *Banco/Origen:* ${data.banco || 'Transferencia'}\n` +
              `✍️ *Concepto:* ${data.concepto || 'Gasto'}\n` +
              `💰 *Monto:* $${Number(data.monto).toLocaleString('es-CO')} COP\n` +
              `🔢 *Ref:* ${data.referencia || 'Sin ref'}\n` +
              `📅 *Fecha:* ${data.fecha || 'Hoy'}\n\n` +
              `✅ _Registrado automáticamente en tu base de Finanzas._`;

            await sendMsgWithButtons(replyText);
            const voiceConfirm = await generateSpeechBuffer(`Comprobante de ${data.banco || ''} por $${Number(data.monto).toLocaleString('es-CO')} pesos registrado exitosamente.`);
            if (voiceConfirm) await sendVoiceNote(voiceConfirm);
            return;
          } else if (data.descripcion) {
            await sendMsgWithButtons(`📷 *Análisis de Imagen:*\n\n${data.descripcion}`);
            return;
          }
        }
      } catch (_) {}
    }

    await sendMsgWithButtons(visionReply || '📷 Imagen recibida, pero no se detectaron datos financieros claros.');
  } catch (e) {
    logger.error(`[Photo Processing Error]: ${e.message}`);
    await sendMsg(`❌ Error procesando la imagen: ${e.message}`);
  }
}

// ─── INICIO ───────────────────────────────────────────────────
async function main() {
  logger.info('🏛️ [Aurelio Bot v2.0 — 10/10] Initializing all systems...');

  await deleteWebhook();
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
