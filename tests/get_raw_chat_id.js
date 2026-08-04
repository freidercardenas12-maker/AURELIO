const https = require('https');
const token = '8231420645:AAF712xzxIuSi3zqhW5CUi1oNqMswGFD2uc';

async function checkRawUpdates() {
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=10`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          console.log('JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Raw output:', d);
        }
        resolve();
      });
    }).on('error', e => console.error(e.message));
  });
}

checkRawUpdates();
