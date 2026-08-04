const https = require('https');
const config = require('../src/config');

async function testRenderPollingConflict() {
  console.log('Testing if Render cloud server is polling Telegram...');
  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1&timeout=1`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          console.log('Telegram API Response:', res.statusCode, JSON.stringify(json));
          if (res.statusCode === 409 || (json.error_code === 409)) {
            console.log('CONFIRMED: Another server (Render!) is actively polling Telegram right now!');
          } else {
            console.log('Response code:', res.statusCode);
          }
        } catch (e) {
          console.log('Raw output:', d);
        }
        resolve();
      });
    }).on('error', e => console.error('Error:', e.message));
  });
}

testRenderPollingConflict();
