const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
const apiKey = env.GEMINI_API_KEY;

const validModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: "Hola test" }] }]
  });

  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`[${model}] Status: ${res.statusCode} ${res.statusCode === 200 ? 'OK' : d.substring(0, 100)}`);
        resolve(res.statusCode === 200);
      });
    });
    req.on('error', e => resolve(false));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing official Gemini models with valid key...');
  for (const m of validModels) {
    await testModel(m);
  }
}

run();
