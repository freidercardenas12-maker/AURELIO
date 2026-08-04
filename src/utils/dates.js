/**
 * Date helper utilities tailored for Colombia (America/Bogota) timezone.
 */

function getColombiaHour() {
  return parseInt(new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', hour12: false }), 10);
}

function getTodayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

function formatColombiaTimestamp() {
  return new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
}

module.exports = {
  getColombiaHour,
  getTodayStr,
  getTomorrowStr,
  formatColombiaTimestamp
};
