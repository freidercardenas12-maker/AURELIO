const { sendMsg } = require('../src/services/telegram');

const answer = `👁️ *Análisis de Imagen por Aurelio:*

Basado en la foto de tu Tablero de Tareas (Kanban) en Notion, las actividades de *Jhon Fredy* son:

1. 📌 *Terminar el módulo de dotación y recepción* (En Curso)
2. 📌 *Terminar lo correspondiente del DOFA* (En Curso)

🏛️ _"La claridad en la ejecución comienza con la precisión en la visión."_ — Aurelio`;

sendMsg(answer).then(() => console.log('Enviado exitosamente a Telegram!'));
