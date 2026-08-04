const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));

// Set environment variables for config
Object.assign(process.env, env);

const { geminiCall } = require('../src/services/gemini');

async function test() {
  console.log('Testing geminiCall with environment variables set...');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  const reply = await geminiCall('Hola Aurelio, responde con un saludo breve.');
  console.log('Gemini Chat Response:', reply);
}

test().catch(e => console.error(e.message));
