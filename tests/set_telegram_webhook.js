const https = require('https');
const token = '8231420645:AAF712xzxIuSi3zqhW5CUi1oNqMswGFD2uc';
const webhookUrl = 'https://aurelio-bot.onrender.com/webhook';

async function setWebhook() {
  console.log(`Setting Telegram Webhook to: ${webhookUrl}...`);
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('Set Webhook Response:', res.statusCode, d);
        resolve();
      });
    }).on('error', e => console.error(e.message));
  });
}

setWebhook();
