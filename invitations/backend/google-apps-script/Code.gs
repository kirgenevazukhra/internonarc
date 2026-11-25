/**
 * Приём ответов анкеты гостя в Google Таблицу.
 * Одна таблица может обслуживать много приглашений: у каждого события свой лист (по event_id).
 * Повторная отправка с тем же response_id обновляет строку, а не создаёт новую.
 */
const MAX = { name: 80, answer: 60, wish: 500, lang: 5 };
const HEADERS = ['Обновлено', 'response_id', 'Имя', 'Ответ', 'Гостей', 'Пожелание', 'Язык', 'Создано'];
const TZ = 'Asia/Almaty';

function doPost(e) {
  try {
    const data = parsePayload_(e && e.postData && e.postData.contents);
    if (!rateLimitOk_(data.response_id)) return json_({ ok: false, error: 'rate_limited' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = sheetFor_(data.event_id);
      const now = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
      const row = [now, data.response_id, data.name, data.answer, data.guests, data.wish, data.lang];
      const ids = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().map(r => r[0]);
      const i = ids.indexOf(data.response_id);
      if (i >= 0) sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);       // обновление ответа
      else sheet.appendRow(row.concat([now]));                                   // новый ответ
    } finally { lock.releaseLock(); }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err).slice(0, 100) });
  }
}

function doGet() { return json_({ ok: true, service: 'rsvp' }); }

/** Проверка и нормализация входящих данных. Браузеру не доверяем. */
function parsePayload_(raw) {
  if (!raw || raw.length > 5000) throw new Error('bad_request');
  const p = JSON.parse(raw);
  const id = String(p.response_id || '');
  const ev = String(p.event_id || '');
  if (!/^[a-f0-9]{24}$/.test(id)) throw new Error('bad_response_id');
  if (!/^[A-Za-z0-9_-]{3,60}$/.test(ev)) throw new Error('bad_event_id');
  const name = clean_(p.name, MAX.name);
  if (!name) throw new Error('name_required');
  const guests = Math.min(20, Math.max(1, parseInt(p.guests, 10) || 1));
  return {
    event_id: ev, response_id: id, name: name,
    answer: clean_(p.answer, MAX.answer), guests: guests,
    wish: clean_(p.wish, MAX.wish), lang: clean_(p.lang, MAX.lang),
  };
}

/** Обрезка, удаление управляющих символов и защита от формул в таблице (=, +, -, @). */
function clean_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

/** Не больше 5 отправок в минуту с одного response_id и 300 в минуту всего. */
function rateLimitOk_(id) {
  const cache = CacheService.getScriptCache();
  const bump = (key, limit) => {
    const n = Number(cache.get(key) || 0) + 1;
    cache.put(key, String(n), 60);
    return n <= limit;
  };
  return bump('rl:' + id, 5) && bump('rl:all', 300);
}

function sheetFor_(eventId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(eventId);
  if (!sh) {
    sh = ss.insertSheet(eventId);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
