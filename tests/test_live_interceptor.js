const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
Object.assign(process.env, env);

const { detectIntent } = require('../src/core/intent');
const { geminiChat } = require('../src/core/chat');

async function test() {
  const text = 'Aurelio, buenas tardes.';
  const isExplicitDataQuery = /(dame|mu[eé]stra|cu[aá]l|cu[aá]nto|agenda|tarea|pendientes|gasto|comprar|lista|reporte|finanzas|caja|debo|deuda|resumen|despacho)/i.test(text);
  const containsGreeting = /(hola|buen|buenas|d[ií]as|tardes|noches|como estas|c[oó]mo est[aá]s|saludos|qu[eé] tal)/i.test(text);
  const isGreetingOrCasual = (containsGreeting && !isExplicitDataQuery) || (text.length < 25 && !isExplicitDataQuery);

  console.log('Testing transcript:', text);
  console.log('containsGreeting:', containsGreeting);
  console.log('isExplicitDataQuery:', isExplicitDataQuery);
  console.log('isGreetingOrCasual:', isGreetingOrCasual);
}

test();
