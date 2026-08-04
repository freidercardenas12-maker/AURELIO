const config = require('../config');
const { queryDB, createPage } = require('../services/notion');
const { sendMsg } = require('../services/telegram');
const { txt, sel, num, dt } = require('../utils/notion-props');
const { getTodayStr } = require('../utils/dates');

async function handleCaja() {
  await sendMsg('⏳ Consultando finanzas en Notion...');
  const rows = await queryDB(config.FINANCES_DB_ID);
  let deudas = 0;
  const pendingItems = [];

  rows.forEach(r => {
    const p = r.properties || {};
    const st = sel(p['Estado']);
    const monto = num(p['Monto']);
    const concepto = txt(p['Concepto']) || 'Sin nombre';
    const vence = dt(p['Fecha de Vencimiento']);
    if (st === 'Pendiente') {
      deudas += monto;
      pendingItems.push({ concepto, monto, vence });
    }
  });

  const efectivo = 1299809;
  const neto = efectivo - deudas;
  let msg = `💰 *Reporte de Caja Real (Notion)*\n\n` +
    `💵 Disponible: *$${efectivo.toLocaleString('es-CO')} COP*\n` +
    `🚨 Deudas Pendientes: *$${deudas.toLocaleString('es-CO')} COP*\n` +
    `⚖️ Saldo Neto: *$${neto.toLocaleString('es-CO')} COP*`;

  if (pendingItems.length > 0) {
    msg += `\n\n📋 *Detalle Pendientes:*\n`;
    pendingItems.slice(0, 6).forEach(i => {
      msg += `  • *${i.concepto}:* $${i.monto.toLocaleString('es-CO')} COP${i.vence !== 'sin fecha' ? ' | Vence: ' + i.vence : ''}\n`;
    });
  }
  await sendMsg(msg);
}

async function handleGasto(text) {
  const parts = text.split(' ');
  if (parts.length < 3) {
    await sendMsg('⚠️ Uso: `/gasto [monto] [concepto]`\nEj: `/gasto 12000 Almuerzo`');
    return;
  }

  const monto = parseInt(parts[1], 10);
  const concepto = parts.slice(2).join(' ');
  if (isNaN(monto)) {
    await sendMsg('⚠️ El monto debe ser un número.');
    return;
  }

  const result = await createPage(config.FINANCES_DB_ID, {
    'Concepto': { title: [{ text: { content: concepto } }] },
    'Monto': { number: monto },
    'Tipo': { select: { name: 'Gasto Fijo' } },
    'Estado': { select: { name: 'Pagado' } },
    'Fecha de Vencimiento': { date: { start: getTodayStr() } }
  });

  if (result) {
    await sendMsg(`✅ *Gasto Registrado*\n\n✍️ *${concepto}*\n💸 $${monto.toLocaleString('es-CO')} COP`);
  } else {
    await sendMsg('❌ Error al registrar el gasto en Notion.');
  }
}

module.exports = { handleCaja, handleGasto };
