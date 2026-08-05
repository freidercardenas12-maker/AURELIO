const { sendMsgWithButtons, sendVoiceNote } = require('../services/telegram');
const { generateSpeechBuffer } = require('../services/tts');
const logger = require('../utils/logger');

async function handleCorazaTechnicalCopilot(query) {
  logger.info(`[Technical Copilot] Processing query for Coraza CTA: "${query}"`);

  let codeSnippet = '';
  let solutionTitle = '';

  if (/cierre|sesion|sesión|movil|móvil|logout/i.test(query)) {
    solutionTitle = '🛠️ Solución Técnica: Bug de Cierre de Sesión en Móviles (Coraza CTA)';
    codeSnippet = `// Fix: Token Refresh & Session Persistence for React Native / Web Mobile
const handleMobileSessionCheck = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const isExpired = checkTokenExpiry(token);
    if (isExpired) {
      const newToken = await refreshToken();
      await AsyncStorage.setItem('userToken', newToken);
    }
  } catch (err) {
    console.error('Session Error:', err);
  }
};`;
  } else {
    solutionTitle = '🛡️ Asistencia Técnica Coraza Seguridad CTA';
    codeSnippet = `// Middleware de Auditoría y Login Seguro
app.use('/api/v1/documental', authenticateJWT, auditLogMiddleware, (req, res) => {
  res.json({ status: 'success', system: 'Coraza Documental Active' });
});`;
  }

  const text = 
    `🛡️ *${solutionTitle}*\n\n` +
    ````javascript\n${codeSnippet}\n```\n\n` +
    `📌 *Instrucciones:* Aplica esta verificación en el middleware de autenticación del cliente móvil de Coraza CTA.`;

  await sendMsgWithButtons(text);

  const voiceMsg = await generateSpeechBuffer(
    'Análisis técnico completado para Coraza Seguridad CTA. El fragmento de código corregido para el control de sesión y auditoría ha sido entregado en Telegram.'
  );
  if (voiceMsg) await sendVoiceNote(voiceMsg);
}

module.exports = { handleCorazaTechnicalCopilot };
