const { sendMsg } = require('../src/services/telegram');

async function test() {
  console.log('Sending test message to Freider Telegram...');
  await sendMsg('🏛️ *Prueba de Sistema Aurelio v2.0*\n\nHola Sr. Cárdenas, este es un mensaje de prueba directa para verificar la conectividad.');
  console.log('Sent!');
}

test().catch(e => console.error(e.message));
