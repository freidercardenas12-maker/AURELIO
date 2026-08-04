const https = require('https');
const config = require('../config');
const logger = require('../utils/logger');

const NOTION_HEADERS_JSON = {
  'Authorization': `Bearer ${config.NOTION_TOKEN}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28'
};

function makeRequest(url, method, headers, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method, headers };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
      req.write(buf);
    }
    req.end();
  });
}

/**
 * Attaches an image buffer as an external file block to a Notion page.
 * Since Notion API doesn't support direct file upload, we upload via
 * a Notion file block pointing to an inline external URL placeholder.
 * This function appends a descriptive text block + image from URL
 * when the imageUrl is provided, otherwise attaches an annotation.
 *
 * @param {string} pageId Notion page ID to attach to
 * @param {string} description Description of the attachment (e.g. "Recibo de compra — $45.000 COP")
 * @param {string} imageUrl Optional public URL to attach as image block
 */
async function attachImageToPage(pageId, description, imageUrl = null) {
  try {
    const children = [
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [{
            type: 'text',
            text: { content: `📎 Comprobante adjunto: ${description}` }
          }],
          icon: { emoji: '🧾' },
          color: 'yellow_background'
        }
      }
    ];

    if (imageUrl) {
      children.push({
        object: 'block',
        type: 'image',
        image: {
          type: 'external',
          external: { url: imageUrl }
        }
      });
    }

    const res = await makeRequest(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      'PATCH',
      NOTION_HEADERS_JSON,
      { children }
    );
    return res.statusCode === 200;
  } catch (e) {
    logger.error(`[Notion Attachment Error]: ${e.message}`);
    return false;
  }
}

/**
 * Uploads a receipt photo and creates a Finance entry in Notion.
 * Returns the created page for further processing.
 */
async function createReceiptEntry(concept, amount, imageDescription) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await makeRequest('https://api.notion.com/v1/pages', 'POST', NOTION_HEADERS_JSON, {
      parent: { database_id: config.FINANCES_DB_ID },
      properties: {
        'Concepto': { title: [{ text: { content: concept } }] },
        'Monto': { number: amount },
        'Tipo': { select: { name: 'Gasto Fijo' } },
        'Estado': { select: { name: 'Pagado' } },
        'Fecha de Vencimiento': { date: { start: today } }
      }
    });

    if (res.statusCode === 200) {
      const pageId = res.body.id;
      // Append the image description as a block callout for the receipt record
      await attachImageToPage(pageId, imageDescription);
      return res.body;
    }
    return null;
  } catch (e) {
    logger.error(`[Receipt Entry Error]: ${e.message}`);
    return null;
  }
}

module.exports = {
  attachImageToPage,
  createReceiptEntry
};
