const https = require('https');
const token = '8231420645:AAF712xzxIuSi3zqhW5CUi1oNqMswGFD2uc';

https.get(`https://api.telegram.org/bot${token}/getWebhookInfo`, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('getWebhookInfo:', res.statusCode, d);
  });
}).on('error', e => console.error(e.message));
