/**
 * AURELIO — Professional Invoice PDF Generator
 * Generates branded invoices in PDF for Chorizos Artesanales orders
 */
const PDFDocument = require('pdfkit');
const { sendDocument, sendVoiceNote } = require('./telegram');
const { generateSpeechBuffer } = require('./tts');
const logger = require('../utils/logger');

async function generateInvoicePDF({ cliente, items, metodoPago = 'Nequi / Bancolombia', observaciones = '' }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primary = '#1e293b';
      const accent = '#d97706';
      const now = new Date();
      const fechaStr = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      const invoiceNum = `AUR-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900)+100}`;

      // Header
      doc.rect(0, 0, 612, 90).fill(primary);
      doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text('CHORIZOS ARTESANALES', 50, 20);
      doc.fillColor(accent).fontSize(11).font('Helvetica').text('Freider Cárdenas — NIT: 1.234.567.890-1', 50, 48);
      doc.fillColor('#fff').fontSize(10).text('Bogotá, Colombia | Tel: 310 123 4567 | @ChorizosArtesanales', 50, 65);

      doc.fillColor(primary).fontSize(16).font('Helvetica-Bold').text('FACTURA DE VENTA', 380, 25);
      doc.fillColor(accent).fontSize(10).font('Helvetica').text(`No. ${invoiceNum}`, 380, 47);
      doc.fillColor('#334155').fontSize(10).text(`Fecha: ${fechaStr}`, 380, 63);

      doc.moveDown(4);

      // Client info
      doc.fillColor(primary).fontSize(12).font('Helvetica-Bold').text('FACTURADO A:');
      doc.strokeColor(accent).lineWidth(1.5).moveTo(50, doc.y + 2).lineTo(562, doc.y + 2).stroke();
      doc.moveDown(0.5);
      doc.fillColor('#334155').fontSize(11).font('Helvetica').text(cliente || 'Cliente', 50, doc.y);
      doc.moveDown(1.5);

      // Items table header
      doc.rect(50, doc.y, 512, 22).fill('#f1f5f9');
      doc.fillColor(primary).fontSize(10).font('Helvetica-Bold');
      const tableY = doc.y + 5;
      doc.text('DESCRIPCIÓN', 55, tableY);
      doc.text('KG', 310, tableY);
      doc.text('PRECIO/KG', 370, tableY);
      doc.text('TOTAL', 470, tableY);
      doc.moveDown(1.5);

      let subtotal = 0;
      items.forEach((item, i) => {
        const lineTotal = (item.cantidad || 0) * (item.precioUnitario || 0);
        subtotal += lineTotal;
        const rowY = doc.y;
        if (i % 2 === 0) doc.rect(50, rowY - 3, 512, 18).fill('#f8fafc');
        doc.fillColor('#334155').fontSize(10).font('Helvetica');
        doc.text(item.descripcion || 'Chorizo Artesanal', 55, rowY);
        doc.text(`${item.cantidad} kg`, 310, rowY);
        doc.text(`$${(item.precioUnitario || 0).toLocaleString('es-CO')}`, 370, rowY);
        doc.text(`$${lineTotal.toLocaleString('es-CO')}`, 470, rowY);
        doc.moveDown(1);
      });

      doc.moveDown(0.5);
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.5);

      const iva = Math.round(subtotal * 0.00); // Régimen simplificado, sin IVA
      const total = subtotal + iva;

      doc.fillColor(primary).fontSize(11).font('Helvetica-Bold').text(`TOTAL A PAGAR: $${total.toLocaleString('es-CO')} COP`, 370, doc.y);
      doc.moveDown(1);

      // Payment
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`Método de pago: ${metodoPago}`, 50, doc.y);
      doc.text('Nequi: 310 123 4567 | Bancolombia Ahorros: 123-456789-00', 50, doc.y + 2);
      if (observaciones) {
        doc.moveDown(0.5);
        doc.fillColor('#64748b').fontSize(10).text(`Observaciones: ${observaciones}`);
      }

      // Footer
      doc.rect(0, 770, 612, 72).fill('#f8fafc');
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique')
        .text('Gracias por su confianza en Chorizos Artesanales. Este documento fue generado automáticamente por Aurelio v10.0.', 50, 782, { align: 'center', width: 512 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function handleInvoiceRequest(text) {
  logger.info(`[Invoice Engine] Generating invoice from: "${text}"`);

  // Parse basic info from text
  const kgMatch = text.match(/(\d+)\s*(kg|kilos?)/i);
  const kg = kgMatch ? parseInt(kgMatch[1]) : 10;
  const precio = kg >= 20 ? 25000 : 28000;

  const clienteMatch = text.match(/para\s+(.+?)(?:\s+de\s+|\s*$)/i);
  const cliente = clienteMatch ? clienteMatch[1].trim() : 'Asadero El Turco';

  const items = [{ descripcion: 'Chorizo Artesanal Premium', cantidad: kg, precioUnitario: precio }];
  const pdfBuf = await generateInvoicePDF({ cliente, items });

  const invoiceName = `Factura_Chorizos_${cliente.replace(/\s/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  await sendDocument(pdfBuf, invoiceName, `🧾 *FACTURA GENERADA — ${cliente}*\n📦 ${kg}kg × $${precio.toLocaleString('es-CO')}/kg\n💵 Total: *$${(kg*precio).toLocaleString('es-CO')} COP*`);

  const voice = await generateSpeechBuffer(`Factura generada y enviada para ${cliente}. Total: $${(kg*precio).toLocaleString('es-CO')} pesos colombianos.`);
  if (voice) await sendVoiceNote(voice);
}

module.exports = { generateInvoicePDF, handleInvoiceRequest };
