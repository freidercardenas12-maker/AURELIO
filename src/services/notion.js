const https = require('https');
const config = require('../config');
const logger = require('../utils/logger');
const { getColombiaHour } = require('../utils/dates');

const NOTION_HEADERS = {
  'Authorization': `Bearer ${config.NOTION_TOKEN}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28'
};

function makeRequest(url, method, headers, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function queryDB(dbId, filter = {}) {
  try {
    const res = await makeRequest(`https://api.notion.com/v1/databases/${dbId}/query`, 'POST', NOTION_HEADERS, filter);
    return res.statusCode === 200 ? (res.body.results || []) : [];
  } catch (e) {
    logger.error(`[Notion Service] queryDB error for DB ${dbId}: ${e.message}`);
    return [];
  }
}

async function createPage(dbId, properties) {
  try {
    const res = await makeRequest('https://api.notion.com/v1/pages', 'POST', NOTION_HEADERS, {
      parent: { database_id: dbId },
      properties
    });
    return res.statusCode === 200 ? res.body : null;
  } catch (e) {
    logger.error(`[Notion Service] createPage error: ${e.message}`);
    return null;
  }
}

async function patchPage(pageId, properties) {
  try {
    const res = await makeRequest(`https://api.notion.com/v1/pages/${pageId}`, 'PATCH', NOTION_HEADERS, { properties });
    return res.statusCode === 200 ? res.body : null;
  } catch (e) {
    logger.error(`[Notion Service] patchPage error for page ${pageId}: ${e.message}`);
    return null;
  }
}

async function appendNote(text) {
  try {
    const dateStr = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }).substring(0, 16);
    const res = await makeRequest(`https://api.notion.com/v1/blocks/${config.NOTAS_PAGE_ID}/children`, 'PATCH', NOTION_HEADERS, {
      children: [{
        object: 'block', type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `${text} — ${dateStr} COT` } }] }
      }]
    });
    return res.statusCode === 200;
  } catch (e) {
    logger.error(`[Notion Service] appendNote error: ${e.message}`);
    return false;
  }
}

module.exports = {
  queryDB,
  createPage,
  patchPage,
  appendNote,
  makeRequest
};
