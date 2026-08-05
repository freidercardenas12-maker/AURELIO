const https = require('https');

function check() {
  return new Promise((resolve) => {
    https.get('https://aurelio-bot.onrender.com/health', (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          console.log(`[Check] Uptime: ${json.uptime}s | Version: ${json.version || 'OLD_VERSION'}`);
          resolve(json.version === 'v3.0_greeting_interceptor_active');
        } catch (e) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
}

async function loop() {
  console.log('Polling Render until version v3.0_greeting_interceptor_active is live...');
  for (let i = 0; i < 30; i++) {
    const isLive = await check();
    if (isLive) {
      console.log('🎉 Render is 100% LIVE with version v3.0_greeting_interceptor_active!');
      return;
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('Timeout waiting for Render deploy.');
}

loop();
