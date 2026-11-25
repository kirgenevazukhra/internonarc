#!/usr/bin/env node
// Сборка приглашений: events/<slug>/config.json + template.html -> dist/<slug>/index.html
// Без зависимостей. Запуск: node scripts/build.mjs [slug]   (BASE_URL=https://... для og:url/og:image)
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const site = JSON.parse(readFileSync(join(root, 'site.json'), 'utf8'));
const baseUrl = (process.env.BASE_URL || site.base_url).replace(/\/$/, '');
const only = process.argv[2];

const KAZ = /[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
const monoOf = (cfg, l) => typeof cfg.couple.monogram === 'object' ? cfg.couple.monogram[l] : cfg.couple.monogram;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function validate(cfg, dir) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };
  need(/^[a-z0-9-]+$/.test(cfg.slug || ''), 'slug: только латиница, цифры и дефис');
  need(cfg.slug === dir, `slug "${cfg.slug}" должен совпадать с именем папки "${dir}"`);
  need(cfg.event_id, 'event_id обязателен');
  need(Array.isArray(cfg.languages) && cfg.languages.length, 'languages: нужен хотя бы один язык');
  need(cfg.languages?.includes(cfg.default_language), 'default_language должен входить в languages');
  need(/^\d{4}-\d{2}-\d{2}$/.test(cfg.date) && !isNaN(Date.parse(cfg.date)), 'date: формат ГГГГ-ММ-ДД');
  need(/^([01]\d|2[0-3]):[0-5]\d$/.test(cfg.time_start), 'time_start: формат ЧЧ:ММ');
  need(/^[+-]\d{2}:\d{2}$/.test(cfg.timezone_offset || '+05:00'), 'timezone_offset: формат +05:00');
  need(cfg.couple?.monogram, 'couple.monogram обязателен');
  const mono = l => typeof cfg.couple?.monogram === 'object' ? cfg.couple.monogram[l] : cfg.couple?.monogram;
  for (const l of cfg.languages || []) {
    need(cfg.texts?.[l], `texts.${l}: нет текстов для языка`);
    need(cfg.couple?.groom?.[l] && cfg.couple?.bride?.[l], `couple: нет имён на языке ${l}`);
    need(mono(l), `couple.monogram: нет монограммы на языке ${l}`);
    need(cfg.og?.title?.[l], `og.title.${l} обязателен`);
    need((cfg.texts?.[l]?.months || []).length === 12, `texts.${l}.months: нужно 12 месяцев`);
    need((cfg.texts?.[l]?.weekdays || []).length === 7, `texts.${l}.weekdays: нужно 7 дней`);
  }
  if (cfg.sections?.venue) {
    need(cfg.venue?.name, 'venue.name обязателен');
    need(/^https:\/\//.test(cfg.venue?.link_2gis || '') || /^https:\/\//.test(cfg.venue?.link_google || ''), 'venue: нужна хотя бы одна https-ссылка на карту');
  }
  if (cfg.sections?.program) need((cfg.program || []).every(p => /^\d{2}:\d{2}$/.test(p.time)), 'program: время в формате ЧЧ:ММ');
  if (cfg.sections?.rsvp) {
    need(/^\d{4}-\d{2}-\d{2}$/.test(cfg.rsvp?.deadline || ''), 'rsvp.deadline: формат ГГГГ-ММ-ДД');
    need(!cfg.rsvp?.endpoint || /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(cfg.rsvp.endpoint) || /^https:\/\//.test(cfg.rsvp.endpoint),
      'rsvp.endpoint: должен быть https-адрес (Apps Script .../exec или Worker)');
  }
  for (const f of [cfg.music, cfg.og?.image].filter(Boolean)) need(existsSync(join(root, 'events', dir, f)), `файл не найден: events/${dir}/${f}`);
  return errs;
}

const template = readFileSync(join(root, 'template.html'), 'utf8');
const slugs = readdirSync(join(root, 'events')).filter(d => !only || d === only);
if (!slugs.length) { console.error(`Нет событий${only ? ` с slug "${only}"` : ''}`); process.exit(1); }

if (!only) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const d of ['css', 'js', 'assets']) cpSync(join(root, d), join(dist, d), { recursive: true });

let failed = 0;
for (const slug of slugs) {
  const dir = join(root, 'events', slug);
  let cfg;
  try { cfg = JSON.parse(readFileSync(join(dir, 'config.json'), 'utf8')); }
  catch (e) { console.error(`✗ ${slug}: config.json не читается — ${e.message}`); failed++; continue; }

  const errs = validate(cfg, slug);
  if (errs.length) { console.error(`✗ ${slug}:\n  - ${errs.join('\n  - ')}`); failed++; continue; }

  const lang = cfg.default_language;
  const out = join(dist, slug);
  rmSync(out, { recursive: true, force: true });
  cpSync(dir, out, { recursive: true, filter: src => !src.endsWith('config.json') });

  const p = cfg.style.palette;
  const vars = {
    lang, og_title: cfg.og.title[lang], og_description: cfg.og.description?.[lang] || '',
    og_url: `${baseUrl}/${slug}/`, og_image: `${baseUrl}/${slug}/${cfg.og.image}`, og_image_alt: cfg.og.image_alt || '',
    color_primary: p.primary, color_background: p.background, color_accent: p.accent, color_text: p.text, color_muted: p.muted,
    music: cfg.music || '',
  };
  let html = template.replace(/{{(\w+)}}/g, (m, k) => {
    if (k === 'config_json') return JSON.stringify(cfg).replace(/</g, '\\u003c');
    if (!(k in vars)) throw new Error(`в шаблоне неизвестная переменная ${m}`);
    return esc(vars[k]);
  });
  writeFileSync(join(out, 'index.html'), html);
  writeFileSync(join(out, 'favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${esc(p.primary)}"/>` +
    `<text x="32" y="41" font-family="Georgia,serif" font-style="italic" font-size="26" text-anchor="middle" fill="${esc(p.accent)}">${esc(monoOf(cfg, lang).replace(/\s/g, ''))}</text></svg>`);

  const warn = [];
  if (cfg.demo) warn.push('demo: true — анкета никуда не отправляет ответы');
  if (cfg.sections.rsvp && !cfg.rsvp.endpoint) warn.push('rsvp.endpoint пуст');
  if (cfg.languages.includes('kk') && !KAZ.test(JSON.stringify(cfg.texts.kk))) warn.push('в казахских текстах нет казахских букв — проверьте раскладку');
  if (baseUrl.includes('example.')) warn.push(`base_url = ${baseUrl} — замените на настоящий домен, иначе превью в WhatsApp не появится`);
  console.log(`✓ ${slug} → dist/${slug}/index.html${warn.length ? '\n  ! ' + warn.join('\n  ! ') : ''}`);
}
process.exit(failed ? 1 : 0);
