const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const { getTodayStr } = require('../utils/dates');

/**
 * Generates an Executive PDF Report Buffer for Freider Cárdenas
 */
async function generateExecutivePDF(data = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', b => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Colors
      const primaryColor = '#1e293b'; // Slate 800
      const accentColor = '#d97706';  // Amber 600
      const darkColor = '#0f172a';    // Slate 900
      const lightBg = '#f8fafc';      // Slate 50

      // Header Banner
      doc.rect(40, 40, 515, 65).fill(primaryColor);
      
      doc.fillColor('#ffffff')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('AURELIO v3.0 — INFORME EJECUTIVO', 55, 55);

      doc.fillColor(accentColor)
         .fontSize(11)
         .font('Helvetica')
         .text(`ESTADO DE OPERACIONES & NEGOCIOS — ${getTodayStr()}`, 55, 82);

      doc.moveDown(3);

      // Section 1: Finanzas & Flujo de Caja
      doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold').text('1. RESUMEN FINANCIERO & FLUJO DE CAJA');
      doc.strokeColor(accentColor).lineWidth(1.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.8);

      const financesText = data.finances || 
        '• Caja Disponible Actual: $1.299.809 COP\n' +
        '• Obligaciones Próximas (próximos 6 días): $3.408.576 COP\n' +
        '  - Arriendo: $1.000.000 COP (Vence 09/08)\n' +
        '  - Universidad: $2.300.000 COP (Vence 09/08)\n' +
        '  - Gimnasio: $100.000 COP\n' +
        '  - Servicios: $98.576 COP\n' +
        '• Déficit proyectado antes del 9 de agosto: -$2.108.767 COP';

      doc.fillColor('#334155').fontSize(10).font('Helvetica').text(financesText, { lineGap: 3 });
      doc.moveDown(1);

      // Visual Vector Bar Chart for Financial Gauge
      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold').text('VISUALIZADOR DE METAS Y SALDOS (COP)');
      doc.rect(40, doc.y + 5, 200, 15).fill('#10b981'); // Caja Available
      doc.fillColor('#ffffff').fontSize(8).text('Caja: $1.3M', 45, doc.y - 12);

      doc.rect(250, doc.y + 5, 300, 15).fill('#ef4444'); // Obligations
      doc.fillColor('#ffffff').fontSize(8).text('Compromisos: $3.3M', 255, doc.y - 12);
      
      doc.moveDown(2);

      // Section 2: Operación Chorizos Artesanales
      doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold').text('2. OPERACIÓN CHORIZOS ARTESANALES (PRIORIDAD 1)');
      doc.strokeColor(accentColor).lineWidth(1.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.8);

      const chorizosText = data.chorizos ||
        '• Despachos Programados:\n' +
        '  - 07 de Agosto: Asadero El Turco — 25 Kg de chorizo artesanal\n' +
        '  - 08 de Agosto: Tienda La Abundancia — 15 Kg de chorizo artesanal\n' +
        '• Meta de Ventas Semanal: Asegurar flujo de caja directo a compras de insumos.';

      doc.fillColor('#334155').fontSize(10).font('Helvetica').text(chorizosText, { lineGap: 3 });
      doc.moveDown(1.5);

      // Section 3: Coraza Seguridad CTA
      doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold').text('3. CORAZA SEGURIDAD CTA (DESARROLLO)');
      doc.strokeColor(accentColor).lineWidth(1.5).moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke();
      doc.moveDown(0.8);

      const corazaText = data.coraza ||
        '• Sprint Activo: Sprint 1 (MFA, Autenticación y Auditoría)\n' +
        '• Tarea Prioritaria: Resolver bug crítico de cierre de sesión en aplicación móvil (En Curso)\n' +
        '• Próximo Hito: Entrega de aplicación de gestión documental hoy a las 10:00 AM.';

      doc.fillColor('#334155').fontSize(10).font('Helvetica').text(corazaText, { lineGap: 3 });
      doc.moveDown(2);

      // Footer
      doc.rect(40, 750, 515, 30).fill(lightBg);
      doc.fillColor('#64748b')
         .fontSize(9)
         .font('Helvetica-Oblique')
         .text('Aurelio v3.0 — Generado automáticamente para Freider Cárdenas | Coraza Seguridad CTA', 50, 760, { align: 'center' });

      doc.end();
    } catch (e) {
      logger.error(`[PDF Service Error]: ${e.message}`);
      reject(e);
    }
  });
}

module.exports = { generateExecutivePDF };
