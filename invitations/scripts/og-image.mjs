#!/usr/bin/env node
// Рисует превью для мессенджеров (1200×630) из конфига события. Нужен Playwright.
// Запуск: node scripts/og-image.mjs <slug>
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');   // глобально установленный Playwright

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) { console.error('Укажите slug: node scripts/og-image.mjs <slug>'); process.exit(1); }
const cfg = JSON.parse(readFileSync(join(root, 'events', slug, 'config.json'), 'utf8'));
const l = cfg.default_language, p = cfg.style.palette;
const fonts = pathToFileURL(join(root, 'assets/shared/fonts/fonts.css')).href;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const [y, m, d] = cfg.date.split('-');

const html = `<!doctype html><html><head><link rel="stylesheet" href="${fonts}"><style>
body{margin:0;width:1200px;height:630px;display:grid;place-items:center;background:${p.primary};color:${p.background};
font-family:'Cormorant Garamond';text-align:center;position:relative;overflow:hidden}
.frame{position:absolute;inset:28px;border:1px solid ${p.accent}99}
.frame2{position:absolute;inset:38px;border:1px solid ${p.accent}44}
.mono{font:italic 500 150px/1 'Cormorant Garamond';color:${p.accent};letter-spacing:-.03em}
.names{font:italic 400 64px/1.1 'Cormorant Garamond';margin-top:10px}
.date{font:400 24px 'Montserrat';letter-spacing:.5em;margin-top:26px;opacity:.85}
</style></head><body><div class="frame"></div><div class="frame2"></div><div>
<div class="mono">${esc(typeof cfg.couple.monogram === 'object' ? cfg.couple.monogram[l] : cfg.couple.monogram)}</div>
<div class="names">${esc(cfg.couple.groom[l])} & ${esc(cfg.couple.bride[l])}</div>
<div class="date">${d} · ${m} · ${y}</div></div></body></html>`;

const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
await pg.setContent(html, { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);
await pg.screenshot({ path: join(root, 'events', slug, cfg.og.image), type: 'jpeg', quality: 86 });
await b.close();
console.log(`✓ events/${slug}/${cfg.og.image}`);
