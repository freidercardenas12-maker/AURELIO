const https = require('https');

const payload = JSON.stringify({
  update_id: 999999,
  message: {
    message_id: 8888,
    from: { id: 5161158082, first_name: "Freider" },
    chat: { id: 5161158082, type: "private" },
    date: Math.floor(Date.now() / 1000),
    text: "Hola Aurelio desde webhook test"
  }
});

const options = {
  hostname: 'aurelio-bot.onrender.com',
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Sending webhook payload to Render...');
const req = https.request(options, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Webhook POST Response Status:', res.statusCode);
    console.log('Webhook POST Response Body:', d);
  });
});

req.on('error', e => console.error('Error:', e.message));
req.write(payload);
req.end();
