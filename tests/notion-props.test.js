const { txt, sel, num, dt, bool } = require('../src/utils/notion-props');

describe('Notion Property Extractors (Null Safety)', () => {
  test('txt() extracts text from title or rich_text safely', () => {
    expect(txt(null)).toBe('');
    expect(txt(undefined)).toBe('');
    expect(txt({})).toBe('');
    expect(txt({ title: [{ plain_text: 'Hola' }] })).toBe('Hola');
    expect(txt({ rich_text: [{ plain_text: 'Mundo' }] })).toBe('Mundo');
  });

  test('sel() extracts select or status name safely', () => {
    expect(sel(null)).toBe('');
    expect(sel({ select: { name: 'Pendiente' } })).toBe('Pendiente');
    expect(sel({ status: { name: 'To Do' } })).toBe('To Do');
  });

  test('num() extracts number safely with default 0', () => {
    expect(num(null)).toBe(0);
    expect(num({ number: 15000 })).toBe(15000);
  });

  test('dt() extracts date start string safely', () => {
    expect(dt(null)).toBe('sin fecha');
    expect(dt({ date: { start: '2026-08-04' } })).toBe('2026-08-04');
  });

  test('bool() extracts checkbox boolean safely', () => {
    expect(bool(null)).toBe(false);
    expect(bool({ checkbox: true })).toBe(true);
  });
});
