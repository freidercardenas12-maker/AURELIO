const { geminiCall } = require('../services/gemini');
const { buildContext } = require('./context');
const { getTodayStr } = require('../utils/dates');
const { getMemoryContext, addMessage } = require('../services/memory');

const PERFIL_FREIDER = `
PERFIL DE FREIDER CÁRDENAS (Tu jefe):
• Emprendedor colombiano, enfocado en negocios de producto físico.
• Vive en Colombia (zona horaria Bogotá, COL UTC-5).
• Sigue la filosofía estoica: disciplina, acción y enfoque.

FRENTES DE NEGOCIO (en orden de prioridad):
1. 🥩 CHORIZOS (Prioridad 1 - Principal): Negocio de chorizos artesanales. CRM activo con clientes y frecuencia de despachos.
2. 👜 ACCESORIOS GUAYAQUIL (Prioridad 2): Importación y venta de accesorios desde Guayaquil.
3. 💐 PERFUMES MEDELLÍN (Prioridad 3): Venta de perfumes en Medellín.

FRENTE LABORAL:
1. 🛡️ CORAZA SEGURIDAD CTA — Empresa donde trabaja Freider como desarrollador.
`;

async function geminiChat(userMessage, intentType = 'CONVERSACION') {
  // CRITICAL FIX: Only fetch Notion database context when explicitly requested or needed!
  // If it's just a greeting or conversational chat, don't dump the whole database.
  const isGreetingOrCasual = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|como estas|que tal|quien eres)/i.test(userMessage.trim());

  let notionContext = '';
  if (!isGreetingOrCasual && intentType !== 'CONVERSACION') {
    notionContext = await buildContext(intentType);
  }

  const memoryContext = getMemoryContext();

  const systemPrompt = `Eres AURELIO — El secretario estoico, estratega y asistente personal de Freider Cárdenas.

${PERFIL_FREIDER}

${memoryContext}

${notionContext ? `════ DATOS REALES DE NOTION (HOY: ${getTodayStr()}) ════\n${notionContext}\n════════════════════════════════════════════════════` : ''}

INSTRUCCIONES DE RESPUESTA (REGLA DE ORO):
1. Responde ÚNICAMENTE Y DIRECTAMENTE a lo que Freider preguntó.
2. Si Freider solo te saluda o pregunta cómo estás ("hola", "buenas tardes", "¿cómo estás?"):
   -> Responde al saludo de forma natural, estoica y breve (2 a 3 oraciones).
   -> NUNCA des un reporte completo de finanzas, tareas o logística A MENOS que te lo pida explícitamente.
3. Si pregunta por datos específicos (tareas, saldos, agenda, despachos), responde con la información requerida de Notion.
4. NUNCA inventes fechas ni montos.
5. Tono: ejecutivo, conversacional, respetuoso, directo y sabio.`;

  const prompt = `${systemPrompt}\n\nFreider dice: "${userMessage}"`;
  const response = await geminiCall(prompt);

  const finalReply = response || '🏛️ Sin conexión a Gemini en este momento. Intenta de nuevo.';
  
  // Save turn to conversation memory
  addMessage(userMessage, finalReply);

  return finalReply;
}

module.exports = {
  geminiChat,
  PERFIL_FREIDER
};
