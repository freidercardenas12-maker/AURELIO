const { geminiCall } = require('../services/gemini');
const { buildContext } = require('./context');
const { getTodayStr } = require('../utils/dates');
const { getMemoryContext, addMessage } = require('../services/memory');
const { recordTopic, getMemorySummary } = require('./sessionMemory');

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
  const isExplicitDataQuery = /(dame|mu[eé]stra|cu[aá]l|cu[aá]nto|agenda|tarea|pendientes|gasto|lista|reporte|finanzas|caja|debo|deuda|resumen|despacho)/i.test(userMessage);
  const containsGreeting = /(hola|buen|buenas|d[ií]as|tardes|noches|como estas|c[oó]mo est[aá]s|saludos|qu[eé] tal)/i.test(userMessage);
  const isGreetingOrCasual = (containsGreeting && !isExplicitDataQuery) || (userMessage.length < 20 && !isExplicitDataQuery);

  if (isGreetingOrCasual) {
    const greetings = [
      'Buenas tardes, Sr. Cárdenas. Me encuentro totalmente enfocado, operativo y listo a sus órdenes. ¿En qué le puedo colaborar el día de hoy?',
      'Buenas tardes, Freider. Todo en orden y bajo control. ¿En qué asunto o frente de negocio enfocaremos nuestra atención en este momento?',
      'Hola, Sr. Cárdenas. Sistema operativo al cien por ciento y listo para la jornada. ¿En qué frente requiere acción inmediata?'
    ];
    const finalReply = greetings[Math.floor(Math.random() * greetings.length)];
    addMessage(userMessage, finalReply);
    return finalReply;
  }

  let notionContext = '';
  if (!isGreetingOrCasual && intentType !== 'CONVERSACION') {
    notionContext = await buildContext(intentType);
  }

  const memoryContext = getMemoryContext();
  const sessionSummary = getMemorySummary();

  const systemPrompt = `Eres AURELIO — El secretario estoico, estratega y asistente personal de Freider Cárdenas.

${PERFIL_FREIDER}

${memoryContext}${sessionSummary}

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
  // Record topic to session memory for future context injection
  recordTopic(userMessage, intentType);

  return finalReply;
}

module.exports = {
  geminiChat,
  PERFIL_FREIDER
};
