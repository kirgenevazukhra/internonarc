/* $INTERN — The Night Shift
 * Launch day: paste the contract address and links below. Nothing else needs editing.
 */
const CONFIG = {
  ca: '0xFc6BA595B82dDbD6913c3D4221b178af171Dc168',
  links: {
    buy: 'https://argus.world/token/0xFc6BA595B82dDbD6913c3D4221b178af171Dc168',
    chart: 'https://dexscreener.com/arc/0x43ec938831d4840c9695db9afb561b0f97e0269b025d27b4da576351e52ae55c',
    x: 'https://x.com/internonarc',
  },
};

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- links & contract address ---------- */
  document.querySelectorAll('[data-link]').forEach((a) => {
    const url = CONFIG.links[a.dataset.link];
    if (url && url !== '#') {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });

  document.querySelectorAll('[data-ca]').forEach((box) => {
    const value = box.querySelector('[data-ca-value]');
    const btn = box.querySelector('[data-ca-copy]');
    const label = box.querySelector('[data-ca-copy-label]');
    if (!CONFIG.ca) return;
    // narrow screens get a middle-truncated address; copying still gives the full one
    const short = `${CONFIG.ca.slice(0, 10)}…${CONFIG.ca.slice(-8)}`;
    const fit = () => { value.textContent = innerWidth < 720 ? short : CONFIG.ca; };
    fit();
    addEventListener('resize', fit);
    value.title = CONFIG.ca;
    btn.disabled = false;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(CONFIG.ca);
        label.textContent = 'Copied';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(value);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        label.textContent = 'Press Ctrl+C';
      }
      btn.classList.add('is-done');
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { label.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
    });
  });

  /* ---------- hero letters ---------- */
  const tilts = [-7, 5, -4, 6, -5, 4];
  document.querySelectorAll('.hero__word span').forEach((s, i) => {
    s.style.setProperty('--i', i);
    s.style.setProperty('--r', `${tilts[i]}deg`);
  });

  /* ---------- seven-segment clock ---------- */
  const SEGS = {
    a: '12,2 44,2 49,7 44,12 12,12 7,7',
    b: '44,14 49,9 54,14 54,43 49,48 44,43',
    c: '44,57 49,52 54,57 54,86 49,91 44,86',
    d: '12,88 44,88 49,93 44,98 12,98 7,93',
    e: '2,57 7,52 12,57 12,86 7,91 2,86',
    f: '2,14 7,9 12,14 12,43 7,48 2,43',
    g: '12,45 44,45 49,50 44,55 12,55 7,50',
  };
  const MAP = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
  const NS = 'http://www.w3.org/2000/svg';
  const clock = document.getElementById('clock');
  const digitsEl = clock.querySelector('[data-digits]');
  const ampmEl = clock.querySelector('[data-ampm]');
  const digits = [];

  const makeDigit = () => {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 56 100');
    svg.setAttribute('aria-hidden', 'true');
    const parts = {};
    for (const k of Object.keys(SEGS)) {
      const p = document.createElementNS(NS, 'polygon');
      p.setAttribute('points', SEGS[k]);
      p.setAttribute('class', 'seg');
      svg.appendChild(p);
      parts[k] = p;
    }
    digitsEl.appendChild(svg);
    return { parts, value: -1 };
  };
  digits.push(makeDigit(), makeDigit());
  const colon = document.createElement('span');
  colon.className = 'clock__colon';
  colon.setAttribute('aria-hidden', 'true');
  colon.innerHTML = '<i></i><i></i>';
  digitsEl.appendChild(colon);
  digits.push(makeDigit(), makeDigit());

  const setDigit = (d, n) => {
    if (d.value === n) return;
    d.value = n;
    const on = MAP[n];
    for (const k in d.parts) d.parts[k].classList.toggle('on', on.includes(k));
  };

  let lastLabel = '';
  const renderTime = (mins) => {
    const total = Math.round(mins) % (24 * 60);
    let h = Math.floor(total / 60);
    const m = total % 60;
    const pm = h >= 12;
    h = h % 12 || 12;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    setDigit(digits[0], +hh[0]);
    setDigit(digits[1], +hh[1]);
    setDigit(digits[2], +mm[0]);
    setDigit(digits[3], +mm[1]);
    const ap = pm ? 'PM' : 'AM';
    if (ampmEl.textContent !== ap) ampmEl.textContent = ap;
    const label = `Shift clock, ${hh}:${mm} ${ap}`;
    if (label !== lastLabel) { clock.setAttribute('aria-label', label); lastLabel = label; }
  };

  /* ---------- scroll-bound shift: time + page colour ---------- */
  const scenes = [...document.querySelectorAll('[data-time]')];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const stops = scenes.map((el) => ({ el, t: toMin(el.dataset.time), c: hex(el.dataset.bg), night: el.classList.contains('tone-night') }));
  let anchors = [];
  const measure = () => {
    anchors = stops.map((s) => {
      const r = s.el.getBoundingClientRect();
      const top = r.top + scrollY;
      // a scene "owns" the clock when its first third reaches the viewport middle
      return top + Math.min(r.height * 0.33, innerHeight * 0.6);
    });
    anchors[0] = innerHeight * 0.5; // top of page reads exactly 09:00
  };

  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const bar = document.querySelector('.bar');
  let lastBg = '';

  const update = () => {
    const y = scrollY + innerHeight * 0.5;
    let i = 0;
    while (i < anchors.length - 1 && y >= anchors[i + 1]) i++;
    const a = stops[i];
    const b = stops[Math.min(i + 1, stops.length - 1)];
    const span = (anchors[i + 1] ?? anchors[i] + 1) - anchors[i];
    const f = i === stops.length - 1 ? 0 : Math.min(1, Math.max(0, (y - anchors[i]) / span));

    const mins = a.t + (b.t - a.t) * f;
    renderTime(mins);

    const e = f * f * (3 - 2 * f);
    const c = a.c.map((v, k) => Math.round(v + (b.c[k] - v) * e));
    const bg = `rgb(${c[0]},${c[1]},${c[2]})`;
    if (bg !== lastBg) {
      root.style.setProperty('--bg', bg);
      if (meta) meta.setAttribute('content', bg);
      lastBg = bg;
    }
    const lum = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    document.body.classList.toggle('is-night', lum < 0.42);
    bar.style.setProperty('--bar-solid', scrollY > 40 ? 1 : 0);

    panCrowd();
    lightsOut(mins);
  };

  /* ---------- crowd horizontal pan ---------- */
  const pan = document.querySelector('[data-pan]');
  const track = pan?.querySelector('[data-pan-track]');
  const panCrowd = () => {
    if (!pan || !track) return;
    const r = pan.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    const max = Math.max(0, track.scrollWidth - innerWidth);
    track.style.transform = `translate3d(${-max * p}px,0,0)`;
  };

  /* ---------- ceiling lamps: off row by row from 5 PM, one left for the intern ---------- */
  const lights = document.querySelector('[data-lights]');
  const lamps = [];
  if (lights) {
    for (let k = 0; k < 12; k++) lamps.push(lights.appendChild(document.createElement('i')));
  }
  const KEEP = 5; // the lamp over the intern's desk
  const order = [0, 11, 1, 10, 2, 9, 3, 8, 7, 4, 6];
  const OFF_FROM = 17 * 60, OFF_TO = 23 * 60;
  const lightsOut = (mins) => {
    if (!lights) return;
    const p = Math.min(1, Math.max(0, (mins - OFF_FROM) / (OFF_TO - OFF_FROM)));
    const n = Math.round(p * order.length);
    order.forEach((idx, k) => lamps[idx].classList.toggle('off', k < n));
    lamps[KEEP].classList.toggle('monitor', mins >= OFF_TO);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  const onResize = () => { measure(); update(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('load', onResize);
  if (document.fonts?.ready) document.fonts.ready.then(onResize);
  measure();
  update();

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el, k) => {
    if (reduced) { el.classList.add('in'); return; }
    el.style.transitionDelay = el.classList.contains('cam') || el.classList.contains('punch') ? `${(k % 4) * 90}ms` : '';
    io.observe(el);
  });

  /* ---------- performance review ---------- */
  const form = document.querySelector('[data-eval]');
  if (form) {
    const rows = ['Technical skills', 'Communication', 'Initiative', 'Learning speed', 'Teamwork', 'Potential'];
    const cols = ['Needs improvement', 'Meets expectations', 'Exceeds expectations'];
    const table = form.querySelector('.eval__table');
    const check = '<svg aria-hidden="true"><use href="#i-check"/></svg>';
    rows.forEach((name, r) => {
      const row = document.createElement('div');
      row.className = 'eval__row';
      row.setAttribute('role', 'radiogroup');
      row.setAttribute('aria-label', name);
      row.innerHTML = `<span aria-hidden="true">${name}</span>` + cols.map((c, k) =>
        `<label class="eval__opt"><input type="radio" name="r${r}" value="${k}" aria-label="${name}: ${c}"><span class="eval__box">${check}</span></label>`
      ).join('');
      table.appendChild(row);
    });

    const notes = form.querySelector('[data-eval-notes]');
    const stamp = form.querySelector('[data-eval-stamp]');
    const blank = notes.textContent;
    const verdicts = [
      [0, 'Notes: Needs improvement across the board. Keep him. He is free.', 'Still unpaid'],
      [1, 'Notes: Meets expectations. Nobody set any. Renew contract (there is no contract).', 'Still unpaid'],
      [2, 'Notes: Exceeds expectations. Promoted to senior intern. Salary adjusted from $0.00 to $0.00.', 'Promoted: intern'],
    ];

    form.addEventListener('change', () => {
      const picked = rows.map((_, r) => form.querySelector(`input[name="r${r}"]:checked`));
      if (picked.some((p) => !p)) {
        const left = picked.filter((p) => !p).length;
        notes.textContent = `Notes: ${left} ${left === 1 ? 'box' : 'boxes'} left. The intern is watching.`;
        form.classList.remove('is-done');
        return;
      }
      const avg = picked.reduce((s, p) => s + +p.value, 0) / rows.length;
      const [, text, verdict] = avg >= 1.67 ? verdicts[2] : avg >= 0.67 ? verdicts[1] : verdicts[0];
      notes.textContent = text;
      stamp.textContent = verdict;
      form.classList.remove('is-done');
      void form.offsetWidth;
      form.classList.add('is-done');
    });
    form.addEventListener('reset', () => {
      form.classList.remove('is-done');
      setTimeout(() => { notes.textContent = blank; }, 0);
    });
  }
})();
