const config = require('../config');
const { queryDB, createPage } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { generateWhatsAppLink } = require('../services/whatsapp');
const { generateCalendarLink } = require('../services/calendar');
const { txt, sel, num, dt } = require('../utils/notion-props');
const logger = require('../utils/logger');

async function syncCRM() {
  try {
    const clients = await queryDB(config.CRM_DB_ID);
    const agenda = await queryDB(config.AGENDA_DB_ID);
    let count = 0;

    for (const c of clients) {
      const p = c.properties || {};
      const nombre    = txt(p['Cliente / Puesto']);
      const pueblo    = sel(p['Pueblo / Ubicación']);
      const kilos     = num(p['Pedido Promedio (Kilos)']);
      const frecuencia = sel(p['Frecuencia Despacho']);
      const ultimoStr = dt(p['Último Envío']);
      const telefono  = txt(p['Teléfono']) || txt(p['Tel']) || '';

      if (!nombre || ultimoStr === 'sin fecha' || !frecuencia) continue;

      const dias = frecuencia === 'Semanal' ? 7 : 14;
      const proximo = new Date(ultimoStr);
      proximo.setDate(proximo.getDate() + dias);
      const proximoStr = proximo.toISOString().split('T')[0];

      if (proximo < new Date()) continue;

      const titulo = `Despacho: ${nombre} — ${kilos}kg (${pueblo})`;
      const yaExiste = agenda.some(e => txt(e.properties?.['Actividad']) === titulo && dt(e.properties?.['Fecha']) === proximoStr);

      if (!yaExiste) {
        const created = await createPage(config.AGENDA_DB_ID, {
          'Actividad': { title: [{ text: { content: titulo } }] },
          'Fecha': { date: { start: proximoStr } },
          'Categoría': { select: { name: 'Emprendimiento' } },
          'Estado': { select: { name: 'Pendiente' } }
        });

        if (created) {
          count++;
          logger.info(`[CRM Sync] Scheduled shipment for: ${nombre} on ${proximoStr}`);

          // WhatsApp quick message link
          const wpMessage = `Hola ${nombre}, habla el equipo de Chorizos Artesanales. Le confirmamos su despacho de ${kilos}kg programado para el ${proximoStr}. Por favor confirmar la recepción. ¡Gracias!`;
          const wpLink = generateWhatsAppLink(telefono, wpMessage);

          // Google Calendar one-click link
          const calLink = generateCalendarLink(titulo, proximoStr, proximoStr, `Despacho de chorizos a ${nombre} — ${kilos}kg en ${pueblo}`);

          let msg = `📅 *Despacho Agendado en Notion*\n`;
          msg += `📍 *${nombre}* — ${pueblo}\n`;
          msg += `⚖️ ${kilos} kg | 📆 ${proximoStr} (${frecuencia})\n\n`;
          msg += `📲 [Enviar WhatsApp al cliente](${wpLink})\n`;
          msg += `📅 [Agregar a Google Calendar](${calLink})`;

          await sendMsg(msg);
        }
      }
    }
    if (count > 0) logger.info(`[CRM Sync] ${count} new shipments scheduled.`);
  } catch (e) {
    logger.error(`[CRM Sync Error]: ${e.message}`);
  }
}

module.exports = { syncCRM };
