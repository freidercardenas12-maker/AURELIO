const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
Object.assign(process.env, env);

const { detectIntent } = require('../src/core/intent');
const { geminiChat } = require('../src/core/chat');

async function test() {
  const msg = 'Muy buenos días.';
  console.log('Testing:', msg);
  const intent = await detectIntent(msg);
  console.log('Detected Intent:', intent.i);
  const reply = await geminiChat(msg, intent.i);
  console.log('Aurelio Reply:', reply);
}

test().catch(e => console.error(e.message));
