const https = require('https');
const token = '8231420645:AAF712xzxIuSi3zqhW5CUi1oNqMswGFD2uc';

async function checkPendingUpdates() {
  console.log('Checking pending updates on Telegram API...');
  const url = `https://api.telegram.org/bot${token}/getUpdates?offset=-5&timeout=2`;
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('getUpdates Response:', res.statusCode);
        try {
          const json = JSON.parse(d);
          console.log('Result Count:', json.result ? json.result.length : 0);
          if (json.result && json.result.length > 0) {
            json.result.forEach(u => {
              const m = u.message;
              if (m) {
                console.log(`Update ID: ${u.update_id} | Chat ID: ${m.chat.id} | From: ${m.from.first_name} | Type: ${m.text ? 'Text' : m.voice ? 'Voice' : m.audio ? 'Audio' : 'Other'}`);
              }
            });
          } else {
            console.log('Raw JSON:', JSON.stringify(json));
          }
        } catch (e) {
          console.log('Raw output:', d);
        }
        resolve();
      });
    }).on('error', e => console.error(e.message));
  });
}

checkPendingUpdates();
