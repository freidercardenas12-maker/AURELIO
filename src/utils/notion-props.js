/**
 * Defensive property extractors for Notion API page objects.
 * Prevents TypeError / null pointer exceptions when reading incomplete Notion objects.
 */

const txt = (prop) => prop?.title?.[0]?.plain_text ?? prop?.rich_text?.[0]?.plain_text ?? '';
const sel = (prop) => prop?.select?.name ?? prop?.status?.name ?? '';
const num = (prop) => prop?.number ?? 0;
const dt  = (prop) => prop?.date?.start ?? 'sin fecha';
const url = (prop) => prop?.url ?? '';
const bool = (prop) => Boolean(prop?.checkbox);

module.exports = {
  txt,
  sel,
  num,
  dt,
  url,
  bool
};
