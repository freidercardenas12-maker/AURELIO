/**
 * AURELIO — Email Composer & Sender via Voice
 * Composes and sends professional emails via Gmail SMTP (nodemailer)
 */
const nodemailer = require('nodemailer');
const { geminiCall } = require('./gemini');
const { sendMsgWithButtons, sendVoiceNote } = require('./telegram');
const { generateSpeechBuffer } = require('./tts');
const logger = require('../utils/logger');

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function composeAndSendEmail(instruction) {
  logger.info(`[Email Engine] Composing email from instruction: "${instruction}"`);

  // Use Gemini to draft the email body
  const prompt = `Eres el asistente ejecutivo de Freider Cárdenas. Redacta un correo electrónico profesional, conciso y ejecutivo en español basado en la siguiente instrucción:\n\n"${instruction}"\n\nResponde SÓLO con el JSON sin markdown:\n{"asunto": "...", "cuerpo": "...", "destinatario": "..."}`;

  let draft = { asunto: 'Asunto Ejecutivo', cuerpo: instruction, destinatario: process.env.GMAIL_USER };
  try {
    const raw = await geminiCall(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    draft = JSON.parse(cleaned);
  } catch (e) {
    logger.warn(`[Email Engine] Gemini parse fallback: ${e.message}`);
  }

  const previewText =
    `✉️ *BORRADOR DE CORREO — AURELIO*\n\n` +
    `📬 *Para:* ${draft.destinatario}\n` +
    `📋 *Asunto:* ${draft.asunto}\n\n` +
    `📝 *Cuerpo:*\n_${draft.cuerpo}_\n\n` +
    `👇 _Revisa y aprueba el envío:_`;

  await sendMsgWithButtons(previewText);

  // Auto-send if Gmail credentials are configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Freider Cárdenas — Aurelio" <${process.env.GMAIL_USER}>`,
        to: draft.destinatario || process.env.GMAIL_USER,
        subject: draft.asunto,
        text: draft.cuerpo,
        html: `<p style="font-family:Arial,sans-serif">${draft.cuerpo.replace(/\n/g, '<br/>')}</p><br/><hr/><small>Enviado automáticamente por Aurelio v10.0 — Asistente de Freider Cárdenas</small>`
      });
      logger.info(`[Email Engine] Email sent to ${draft.destinatario}`);
      const voice = await generateSpeechBuffer(`Correo enviado exitosamente a ${draft.destinatario}. Asunto: ${draft.asunto}.`);
      if (voice) await sendVoiceNote(voice);
    } catch (e) {
      logger.error(`[Email Engine Send Error]: ${e.message}`);
      await sendMsgWithButtons(`❌ *Error al enviar:* ${e.message}\n\n_Configura GMAIL_USER y GMAIL_APP_PASSWORD en tu .env para habilitar el envío._`);
    }
  } else {
    await sendMsgWithButtons(`⚠️ _Para enviar correos automáticamente, agrega GMAIL\\_USER y GMAIL\\_APP\\_PASSWORD a tu archivo .env._`);
  }
}

module.exports = { composeAndSendEmail };
