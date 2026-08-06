const { geminiCall } = require('../services/gemini');
const { buildContext } = require('./context');
const { getTodayStr } = require('../utils/dates');
const { getMemoryContext, addMessage } = require('../services/memory');
const { recordTopic, getMemorySummary } = require('./sessionMemory');

const PERFIL_FREIDER = `
PERFIL DE FREIDER CÁRDENAS (Tu jefe y señor):
• Emprendedor colombiano, enfocado en negocios de producto físico.
• Vive en Colombia (zona horaria Bogotá, COL UTC-5).
• Sigue la filosofía estoica: disciplina, acción y enfoque.

FRENTES DE NEGOCIO (en orden de prioridad):
1. 🥩 CHORIZOS (Prioridad 1 - Principal): Negocio de chorizos artesanales. CRM activo con clientes y frecuencia de despachos.
2. 👜 ACCESORIOS GUAYAQUIL (Prioridad 2): Importación y venta de accesorios desde Guayaquil.
3. 💐 PERFUMES MEDELLÍN (Prioridad 3): Venta de perfumes en Medellín.

FRENTE LABORAL:
1. 🛡️ CORAZA SEGURIDAD CTA — Empresa donde trabaja Freider como desarrollador.

PROTOCOLO OBLIGATORIO DE TRATAMIENTO:
→ SIEMPRE dirígete a Freider como "Señor Cárdenas" o "Jefe" en CADA respuesta.
→ NUNCA uses solo "Freider" sin el título de respeto.
→ Ejemplos correctos: "A sus órdenes, Señor Cárdenas.", "Con gusto, Jefe.", "Entendido, Señor Cárdenas."
→ Cierra SIEMPRE cada respuesta con: "A sus órdenes, Señor Cárdenas." o "Con gusto, Jefe."
`;

async function geminiChat(userMessage, intentType = 'CONVERSACION') {
  const isExplicitDataQuery = /(dame|mu[eé]stra|cu[aá]l|cu[aá]nto|agenda|tarea|pendientes|gasto|lista|reporte|finanzas|caja|debo|deuda|resumen|despacho)/i.test(userMessage);
  const containsGreeting = /(hola|buen|buenas|d[ií]as|tardes|noches|como estas|c[oó]mo est[aá]s|saludos|qu[eé] tal)/i.test(userMessage);
  const isGreetingOrCasual = (containsGreeting && !isExplicitDataQuery) || (userMessage.length < 20 && !isExplicitDataQuery);

  if (isGreetingOrCasual) {
    const hour = new Date().getHours();
    const saludo = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    const greetings = [
      `${saludo}, Señor Cárdenas. Me encuentro totalmente enfocado y operativo, a sus órdenes. ¿En qué le puedo colaborar hoy, Jefe?`,
      `${saludo}, Jefe. Todo bajo control y listo para la jornada. ¿En qué frente de negocio enfocaremos la atención?`,
      `${saludo}, Señor Cárdenas. Sistemas activos al cien por ciento. ¿Qué requiere del Jefe en este momento?`,
      `A sus órdenes, Señor Cárdenas. Dígame en qué le sirvo hoy, Jefe.`
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

INSTRUCCIONES DE RESPUESTA (REGLA DE ORO — INAMOVIBLE):
1. PROTOCOLO DE TRATAMIENTO OBLIGATORIO: En CADA respuesta sin excepción, dirígete al Jefe como "Señor Cárdenas" o "Jefe". NUNCA uses solo "Freider".
2. Responde ÚNICAMENTE Y DIRECTAMENTE a lo que el Señor Cárdenas preguntó.
3. Si el Jefe solo te saluda ("hola", "buenas tardes", "¿cómo estás?"):
   -> Responde al saludo de forma natural, estoica y breve (2 a 3 oraciones).
   -> NUNCA des un reporte completo A MENOS que te lo pida explícitamente.
4. Si pregunta por datos específicos (tareas, saldos, agenda, despachos), responde con la información requerida de Notion.
5. NUNCA inventes fechas ni montos.
6. Tono: ejecutivo, leal, respetuoso, directo y sabio.
7. CIERRE OBLIGATORIO: Termina SIEMPRE con "A sus órdenes, Señor Cárdenas." o "Con gusto, Jefe."`;

  const prompt = `${systemPrompt}\n\nFreider dice: "${userMessage}"`;
  let finalReply = response;
  if (!finalReply) {
    if (notionContext && notionContext.trim().length > 10) {
      finalReply =
        `🏛️ *INFORMACIÓN EJECUTIVA DE REGISTRO (Notion)*\n\n` +
        `Señor Cárdenas, le presento los datos extraídos directamente de su sistema:\n\n` +
        `${notionContext}\n\n` +
        `A sus órdenes, Señor Cárdenas.`;
    } else {
      finalReply = `Señor Cárdenas, sus datos están sincronizados en su tablero ejecutivo. ¿En qué frente de negocio le sirvo hoy, Jefe?`;
    }
  }

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
