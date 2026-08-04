const { queryDB } = require('./notion');
const { sendMsg } = require('./telegram');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Scans Chorizos CRM Database and alerts about inactive clients (>14 days)
 * generating 1-click WhatsApp reactivation links.
 */
async function runCRMReactivationAgent() {
  logger.info('[CRM Agent] Running proactive client reactivation scan...');
  try {
    const clients = await queryDB(config.CRM_DB_ID);
    if (!clients || clients.length === 0) {
      logger.info('[CRM Agent] No client data found in Notion.');
      return;
    }

    const today = new Date();
    const inactiveClients = [];

    for (const page of clients) {
      const props = page.properties;
      const clientName = props['Cliente']?.title?.[0]?.plain_text || 'Cliente';
      const phone = props['Teléfono']?.phone_number || props['WhatsApp']?.phone_number || '';
      const lastOrderDateStr = props['Última Compra']?.date?.start || props['Fecha']?.date?.start;

      if (lastOrderDateStr) {
        const lastDate = new Date(lastOrderDateStr);
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays >= 14) {
          inactiveClients.push({
            name: clientName,
            phone: phone.replace(/[^\d]/g, ''),
            days: diffDays
          });
        }
      }
    }

    if (inactiveClients.length > 0) {
      let alertMsg = `🥩 *ALERTA PROACTIVA DE VENTAS — CHORIZOS ARTESANALES*\n\nSe detectaron ${inactiveClients.length} cliente(s) que no realizan pedido hace más de 14 días:\n\n`;

      for (const client of inactiveClients) {
        const text = encodeURIComponent(`Hola ${client.name}, ¿cómo estás? Te saluda Freider Cárdenas de Chorizos Artesanales. Pasaba a saludarte y saber cómo vas de inventario de chorizos para los despachos de esta semana. ¡Quedo atento!`);
        const waLink = client.phone ? `https://wa.me/${client.phone.startsWith('57') ? client.phone : '57' + client.phone}?text=${text}` : '#';

        alertMsg += `📌 *${client.name}* (${client.days} días sin pedir)\n`;
        if (client.phone) {
          alertMsg += `💬 [Reactivar por WhatsApp](${waLink})\n\n`;
        } else {
          alertMsg += `⚠️ Sin teléfono registrado en Notion.\n\n`;
        }
      }

      await sendMsg(alertMsg);
      logger.info(`[CRM Agent] Reactivation alert sent for ${inactiveClients.length} client(s).`);
    } else {
      logger.info('[CRM Agent] All clients are active within the 14-day threshold.');
    }
  } catch (e) {
    logger.error(`[CRM Agent Error]: ${e.message}`);
  }
}

module.exports = { runCRMReactivationAgent };
