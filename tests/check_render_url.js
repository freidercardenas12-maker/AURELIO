const https = require('https');

const urls = [
  'https://aurelio-bot.onrender.com/health',
  'https://aurelio.onrender.com/health',
  'https://aurelio-bot-1.onrender.com/health'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`[${url}] Status: ${res.statusCode} Body: ${d.substring(0, 150)}`);
        resolve(res.statusCode === 200);
      });
    }).on('error', (e) => {
      console.log(`[${url}] Error: ${e.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('Probing Render Health Endpoints...');
  for (const u of urls) {
    await checkUrl(u);
  }
}

run();
