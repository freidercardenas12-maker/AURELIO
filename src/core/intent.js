const { geminiCall } = require('../services/gemini');
const { getTodayStr, getTomorrowStr } = require('../utils/dates');
const logger = require('../utils/logger');

async function detectIntent(userMessage) {
  const isExplicitDataQuery = /(dame|mu[eé]stra|cu[aá]l|cu[aá]nto|agenda|tarea|pendientes|gasto|comprar|lista|reporte|finanzas|caja|debo|deuda|resumen|despacho)/i.test(userMessage);
  const containsGreeting = /(hola|buen|buenas|d[ií]as|tardes|noches|como estas|c[oó]mo est[aá]s|saludos|qu[eé] tal)/i.test(userMessage);
  if (containsGreeting && !isExplicitDataQuery) {
    return { i: 'CONVERSACION' };
  }

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  const prompt = `Eres Aurelio, el asistente ejecutivo estoico de Freider Cárdenas.
Analiza el mensaje en español y responde ÚNICAMENTE con JSON válido puro, sin explicaciones ni markdown.

Fecha actual (Hoy): ${todayStr}
Mañana: ${tomorrowStr}

Mensaje de Freider: "${userMessage}"

Intenciones disponibles:
- CONSULTAR_AGENDA: Freider PREGUNTA o PIDE VER sus actividades, eventos, citas, reuniones o agenda (ej: "¿qué tengo mañana?", "muéstrame la agenda", "¿qué actividades hay?").
- CONSULTAR_TAREAS: Freider PREGUNTA por sus tareas o pendientes del Kanban (ej: "¿qué tareas faltan?", "¿cuáles son los pendientes?").
- CONSULTAR_FINANZAS: Freider PREGUNTA por deudas, pagos, arriendo o saldos (ej: "¿cuánto debo?", "¿cuándo vence el arriendo?").
- CONSULTAR_CORAZA: Freider PREGUNTA por sus tareas de trabajo en Coraza Seguridad CTA (ej: "¿qué tengo en Coraza?", "¿qué está en QA?").
- CREAR_TAREA: Freider DA UNA ORDEN DE CREAR/APUNTAR una nueva tarea en el Kanban (ej: "apúntame...", "crea una tarea para...").
- CREAR_AGENDA: Freider DA UNA ORDEN DE AGENDAR/PROGRAMAR una reunión o evento (ej: "agenda una reunión con X para mañana").
- CREAR_GASTO: Freider registra un gasto o pago realizado (ej: "gasté 20000").
- CONVERSACION: saludo, charla libre o filosofía.

FORMATOS DE SALIDA (SOLO JSON):
{"i": "CONSULTAR_AGENDA"}
{"i": "CONSULTAR_TAREAS"}
{"i": "CONSULTAR_FINANZAS"}
{"i": "CONSULTAR_CORAZA"}
{"i": "CREAR_TAREA", "tarea": "texto de la tarea", "fecha": "${tomorrowStr}"}
{"i": "CREAR_AGENDA", "actividad": "texto del evento/reunión", "fecha": "${tomorrowStr}"}
{"i": "CREAR_GASTO", "monto": 15000, "concepto": "descripción"}
{"i": "CONVERSACION"}`;

  const raw = await geminiCall(prompt);
  if (!raw) return { i: 'CONVERSACION' };
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{.*\}/s);
    return match ? JSON.parse(match[0]) : { i: 'CONVERSACION' };
  } catch (e) {
    logger.error(`[Intent Classifier Error]: ${e.message}`);
    return { i: 'CONVERSACION' };
  }
}

module.exports = { detectIntent };
