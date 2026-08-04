const https = require('https');
const token = '8231420645:AAF712xzxIuSi3zqhW5CUi1oNqMswGFD2uc';

async function checkWebhookInfo() {
  const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('Webhook Info:', res.statusCode, d);
        resolve();
      });
    }).on('error', e => console.error(e.message));
  });
}

checkWebhookInfo();
