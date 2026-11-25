// Анкета гостя. Отправка в Google Apps Script как text/plain (без CORS-preflight).
// Повторная отправка с тем же response_id обновляет строку, а не создаёт новую.
export function initRsvp(form, cfg, guestName) {
  const KEY = `inv:${cfg.slug}:rsvp`;
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  const responseId = saved?.response_id || randomId();
  let t = () => '', state = saved ? 'done' : 'idle', sending = false;

  const msg = form.querySelector('[data-form-msg]');
  const btn = form.querySelector('[data-submit]');
  const optionsBox = form.querySelector('[data-options]');
  const guests = form.querySelector('[data-guests]');

  if (guests) {
    for (let i = 1; i <= (cfg.rsvp.max_guests || 4); i++) guests.add(new Option(String(i), String(i)));
  }
  if (saved) {
    form.name.value = saved.name || '';
    if (guests) guests.value = saved.guests || '1';
    form.wish.value = saved.wish || '';
  } else if (guestName) form.name.value = guestName;

  function render(tr) {
    t = tr;
    const legend = optionsBox.querySelector('legend');
    const current = form.querySelector('input[name="answer"]:checked')?.value ?? saved?.answer;
    optionsBox.replaceChildren(legend, ...t('rsvp_options').map((label, i) => {
      const l = document.createElement('label'); l.className = 'opt';
      l.innerHTML = `<input type="radio" name="answer" value="${i}"><span></span>`;
      l.lastChild.textContent = label;
      if (String(current) === String(i)) l.firstChild.checked = true;
      return l;
    }));
    setState(state, true);
  }

  function setState(s, quiet) {
    state = s;
    btn.disabled = s === 'submitting';
    btn.textContent = s === 'submitting' ? t('rsvp_sending') : (s === 'done' || s === 'success') ? t('rsvp_update') : t('rsvp_submit');
    if (quiet) return;
    msg.className = 'form__msg' + (s === 'error' || s === 'offline' || s === 'invalid' ? ' is-error' : s === 'demo' ? ' is-demo' : '');
  }
  const say = (text, s) => { msg.textContent = text; setState(s); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;                                   // защита от двойного нажатия
    const name = form.name.value.trim();
    const answer = form.querySelector('input[name="answer"]:checked')?.value;
    if (!name) { form.name.focus(); return say(t('rsvp_required'), 'invalid'); }
    if (answer === undefined) return say(t('rsvp_choose'), 'invalid');
    if (form.website.value) return say(t('rsvp_success'), 'success');   // бот — делаем вид, что всё ок

    const payload = {
      event_id: cfg.event_id, response_id: responseId, lang: document.documentElement.lang,
      name, answer: t('rsvp_options')[answer], answer_index: Number(answer),
      guests: guests ? Number(guests.value) : 1, wish: form.wish.value.trim().slice(0, 500),
    };

    if (!cfg.rsvp.endpoint) {                               // честный демо-режим, без имитации отправки
      return say(t('rsvp_demo'), 'demo');
    }
    if (!navigator.onLine) return say(t('rsvp_offline'), 'offline');

    sending = true; say('', 'submitting');
    try {
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(cfg.rsvp.endpoint, {
        method: 'POST', body: JSON.stringify(payload), signal: ctrl.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
      });
      clearTimeout(to);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || res.status);
      localStorage.setItem(KEY, JSON.stringify({ ...payload, answer: Number(answer) }));
      say(t('rsvp_success'), 'success');
    } catch {
      say(navigator.onLine ? t('rsvp_error') : t('rsvp_offline'), navigator.onLine ? 'error' : 'offline');
    } finally { sending = false; }
  });

  return { render };
}

function randomId() {
  const a = new Uint8Array(12); crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}
