const https = require('https');
const token = '8231420645:AAF712xzxIuSi3zqhW5CUi1oNqMswGFD2uc';

async function deleteWebhook() {
  console.log('Deleting Telegram Webhook to clear 409 Conflict...');
  const url = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('deleteWebhook Response:', res.statusCode, d);
        resolve();
      });
    }).on('error', e => console.error(e.message));
  });
}

deleteWebhook();
