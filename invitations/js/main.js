import { renderCalendar } from './calendar.js';
import { createCountdown } from './countdown.js';
import { initReveals, initTimeline } from './animations.js';
import { createAudio } from './audio.js';
import { initRsvp } from './rsvp.js';

const cfg = JSON.parse(document.getElementById('event-config').textContent);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);

// ---- язык ----
const LANG_KEY = `inv:${cfg.slug}:lang`;
let lang = [params.get('lang'), localStorage.getItem(LANG_KEY), cfg.default_language]
  .find(l => l && cfg.languages.includes(l));

// ---- именное обращение: ?to=Имя (только текст, без HTML) ----
const guestName = cfg.personal_greeting
  ? (params.get('to') || '').replace(/[<>{}]/g, '').trim().slice(0, 40)
  : '';

const t = key => cfg.texts[lang][key] ?? '';
const L = v => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[lang] ?? '') : (v ?? '');
const pad = n => String(n).padStart(2, '0');
const [Y, M, D] = cfg.date.split('-').map(Number);

const countdown = createCountdown($('[data-countdown]'), cfg);
const audio = createAudio($('#music'), $('#sound'), () => t);
let timeline;

function render() {
  document.documentElement.lang = lang;
  $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $$('[data-monogram]').forEach(el => { el.textContent = L(cfg.couple.monogram); });
  $$('[data-name]').forEach(el => { el.textContent = L(cfg.couple[el.dataset.name]); });
  $('[data-date-short]').textContent = `${pad(D)} · ${pad(M)} · ${Y}`;
  $('[data-greeting]').textContent = guestName ? t('greeting_personal').replace('{name}', guestName) : t('greeting');
  $('#envelope')?.setAttribute('aria-label', t('open_hint'));

  $('[data-venue-name]').textContent = cfg.venue.name;
  $('[data-venue-type]').textContent = L(cfg.venue.type);
  $('[data-venue-address]').textContent = L(cfg.venue.address);
  setLink('[data-link-2gis]', cfg.venue.link_2gis);
  setLink('[data-link-google]', cfg.venue.link_google);

  $('[data-hosts]').textContent = L(cfg.hosts);
  $('[data-dress-colors]').replaceChildren(...(cfg.dress_code?.colors || []).map(c => {
    const s = document.createElement('span'); s.className = 'dress__dot'; s.style.background = c; return s;
  }));

  const [dy, dm, dd] = cfg.rsvp.deadline.split('-');
  $('[data-rsvp-sub]').textContent = t('rsvp_subtitle').replace('{deadline}', `${dd}.${dm}.${dy}`);

  renderCalendar($('[data-cal-grid]'), $('[data-cal-month]'), $('[data-cal-year]'), Y, M, D, t('months'), t('weekdays'));
  renderProgram();
  countdown.setTexts(t('countdown_units'), t('countdown_done'));
  audio.updateLabel();
  rsvp?.render(t);

  $$('#lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  timeline?.layout();
}

function setLink(sel, href) {
  const a = $(sel);
  if (href) { a.href = href; a.hidden = false; } else a.hidden = true;
}

function renderProgram() {
  $('[data-tl-list]').replaceChildren(...cfg.program.map(p => {
    const li = document.createElement('li'); li.className = 'tl__item';
    li.innerHTML = `<svg class="tl__icon" aria-hidden="true"><use href="#i-${p.icon || 'star'}"/></svg>
      <div class="tl__text"><span class="tl__time"></span><span class="tl__title"></span></div>`;
    li.querySelector('.tl__time').textContent = p.time;
    li.querySelector('.tl__title').textContent = L(p.title);
    return li;
  }));
}

// секции, выключенные в конфиге
for (const [name, on] of Object.entries(cfg.sections)) {
  if (!on) $$(`[data-section="${name}"]`).forEach(s => s.remove());
}
if (!cfg.rsvp.ask_guest_count) $('[data-guests-field]')?.remove();

// переключатель языков
if (cfg.languages.length > 1) {
  $('#lang').replaceChildren(...cfg.languages.map(l => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.lang = l; b.textContent = l.toUpperCase();
    b.addEventListener('click', () => { lang = l; localStorage.setItem(LANG_KEY, l); render(); });
    return b;
  }));
} else $('#lang').remove();

const rsvp = $('#rsvp-form') ? initRsvp($('#rsvp-form'), cfg, guestName) : null;
render();

// ---- открытие конверта ----
const intro = $('#intro');
let opened = false;
function open() {
  if (opened) return; opened = true;
  audio.start();                        // звук стартует только в обработчике нажатия
  intro.classList.add('is-opening');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    intro.classList.add('is-open');
    document.body.classList.remove('is-locked');
    $('#page').removeAttribute('aria-hidden');
    $('#controls').hidden = false;
    initReveals();
    timeline = initTimeline($('[data-timeline]'));
    countdown.start();
  }, reduce ? 300 : 1500);
  setTimeout(() => intro.remove(), reduce ? 800 : 2600);
}
$('#envelope').addEventListener('click', open);

// для скриншотов и проверок: ?open=1 открывает сразу без звука
if (params.get('open') === '1') { audio.disable(); open(); }
