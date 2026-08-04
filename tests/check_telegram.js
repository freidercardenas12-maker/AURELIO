const https = require('https');
const config = require('../src/config');

async function check() {
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getMe`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('Bot Status:', res.statusCode, d.substring(0, 200));
        resolve();
      });
    }).on('error', e => console.error('Error:', e.message));
  });
}

check();
