const https = require('https');

https.get('https://aurelio-bot.onrender.com/health', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Render Status:', res.statusCode, d);
  });
}).on('error', e => console.error(e.message));
