const https = require('https');
const logger = require('../utils/logger');

/**
 * Creates a Google Calendar event via the public Calendar API.
 * NOTE: Requires a Google Service Account or OAuth token.
 * This module generates a "Add to Google Calendar" one-click link
 * (no OAuth needed — opens browser for the user to confirm).
 *
 * @param {string} title Event title
 * @param {string} startISO Start datetime in ISO format (e.g. "2026-08-04T10:00:00")
 * @param {string} endISO End datetime in ISO format (e.g. "2026-08-04T11:00:00")
 * @param {string} description Optional event description
 * @returns {string} One-click link to add to Google Calendar
 */
function generateCalendarLink(title, startISO, endISO, description = '') {
  const format = (dt) => {
    if (!dt) return '';
    return dt.replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let start = startISO;
  let end = endISO;

  // If only date provided (no time), use all-day format YYYYMMDD
  if (startISO && !startISO.includes('T')) {
    start = startISO.replace(/-/g, '');
    end = endISO ? endISO.replace(/-/g, '') : start;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${start}/${end}`,
      details: description
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${format(start)}/${format(end)}`,
    details: description
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

module.exports = { generateCalendarLink };
