const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel, dt } = require('../utils/notion-props');

async function handleClientes() {
  await sendMsg('🥩 Consultando CRM de Chorizos...');
  const crm = await queryDB(config.CRM_DB_ID);
  if (!crm.length) {
    await sendMsg('🥩 Sin clientes registrados en el CRM.');
    return;
  }

  let msg = `🥩 *Clientes Chorizos — CRM (${crm.length})*\n\n`;
  const { generateWhatsAppLink } = require('../services/whatsapp');
  crm.slice(0, 10).forEach(c => {
    const p      = c.properties || {};
    const nombre = txt(p['Cliente / Puesto']);
    const pueblo = sel(p['Pueblo / Ubicación']);
    const freq   = sel(p['Frecuencia Despacho']);
    const ultimo = dt(p['Último Envío']);
    const tel    = txt(p['Teléfono']) || txt(p['Tel']) || '';
    const wpMsg  = `Hola ${nombre}, habla el equipo de Chorizos Artesanales. Queremos coordinar su próximo pedido. ¿Cómo está de inventario?`;
    const wpLink = generateWhatsAppLink(tel, wpMsg);

    if (nombre) {
      msg += `👤 *${nombre}* (${pueblo})\n   Frecuencia: ${freq} | Último: ${ultimo}\n   📲 [Enviar WhatsApp al cliente](${wpLink})\n\n`;
    }
  });
  await sendMsg(msg);
}

module.exports = { handleClientes };
