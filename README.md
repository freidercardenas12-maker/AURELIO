# 🏛️ Aurelio v2.0 — Executive Assistant & Stoic Secretary

> Autonomous AI Assistant connected to Telegram, Notion & Gemini for Freider Cárdenas.

---

## 🌟 Highlights & Architecture (10/10)

- **Modular Design**: Clean separation of concerns into `services`, `core`, `commands`, `jobs`, `utils`, `config`.
- **Security First**: All tokens and DB IDs isolated in `.env` (git-ignored). `.env.example` provided for onboarding.
- **Resilient AI Failover**: Gemini model pool (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-flash-latest`) with automatic rate-limit rotation.
- **Message Queue**: Sequential message processing via `p-queue` to guarantee zero race conditions.
- **Logging**: Enterprise logging with `winston` writing to `logs/aurelio.log` and `logs/error.log`.
- **Health Monitoring**: `GET /health` Express endpoint for uptime checkers (UptimeRobot).
- **Proactive Alerts**: Background cron jobs for meeting alerts, task updates, CRM sync, morning briefings (7:00 AM), midday checks (12:00 PM), and evening reviews (8:00 PM).
- **Unit Tested**: 100% test coverage on utilities with Jest.

---

## 🚀 Quick Start

### 1. Installation
```bash
cd aurelio
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your API tokens:
```bash
cp .env.example .env
```

### 3. Run Tests
```bash
npm test
```

### 4. Start in Production
```bash
npm start
```

---

## 📱 Telegram Command Menu

| Command | Description |
|---|---|
| `/resumen` | 🧠 Executive daily briefing |
| `/agenda` | 📅 Upcoming Notion calendar events |
| `/tareas` | 📌 Kanban pending tasks |
| `/coraza` | 🛡️ Coraza Seguridad CTA dev board |
| `/clientes` | 🥩 Chorizos CRM clients |
| `/caja` | 💰 Real-time financial balance |
| `/negocios` | 📈 Business strategy & margins |
| `/habito` | 🧘 Daily habits progress |
| `/hecho [name]` | 💪 Complete a daily habit |
| `/terminar [task]` | ✅ Mark Kanban task as Done |
| `/gasto [amount] [name]` | ✍️ Log financial expense |
| `/sincronizar` | 🔄 Sync CRM -> Agenda |
| `/ayuda` | 🏛️ List all commands |

---

## ⚙️ PM2 Process Management

To run as an unkillable daemon process:
```bash
npm install -g pm2
pm2 start pm2.config.js
pm2 save
pm2 startup
```

---

*Engineered for performance, stability, and executive decision-making.* 🚀
