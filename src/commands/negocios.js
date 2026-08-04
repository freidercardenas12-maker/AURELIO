const config = require('../config');
const { queryDB } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, num } = require('../utils/notion-props');

async function handleNegocios() {
  await sendMsg('📈 Cargando estrategia de negocios...');
  const estrategia = await queryDB(config.ESTRATEGIA_DB_ID);
  if (!estrategia.length) {
    await sendMsg('📈 Sin datos de estrategia en Notion.');
    return;
  }

  let msg = `📈 *Estrategia de Negocios (Notion)*\n\n`;
  estrategia.forEach(e => {
    const p    = e.properties || {};
    const neg  = txt(p['Negocio']);
    const fun  = txt(p['Función Principal']);
    const prio = num(p['Prioridad']);
    const cap  = num(p['Capital Sugerido']);
    const mar  = txt(p['Márgenes Estimados']);
    const icons = ['🥩', '👜', '💐'];
    if (neg) msg += `${icons[prio - 1] || '🟢'} *[P${prio}] ${neg}*\n   ${fun}\n   Capital: $${cap.toLocaleString('es-CO')} | Margen: ${mar}\n\n`;
  });
  await sendMsg(msg);
}

module.exports = { handleNegocios };
