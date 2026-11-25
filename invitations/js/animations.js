// Появление элементов при прокрутке + линия программы, которая прорисовывается по мере прокрутки.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initReveals() {
  const els = [...document.querySelectorAll('[data-reveal], .tl__item, .cal')];
  // небольшая задержка между элементами одного блока
  const bySection = new Map();
  els.forEach(el => {
    const s = el.closest('section, footer') || document.body;
    const i = bySection.get(s) || 0; bySection.set(s, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 5) * 0.12}s`);
  });
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  els.forEach(el => io.observe(el));
}

export function initTimeline(root) {
  if (!root) return null;
  const svg = root.querySelector('.tl__line');
  const path = root.querySelector('[data-tl-path]');
  let len = 1, ticking = false;

  function layout() {
    const box = root.getBoundingClientRect();
    const icons = [...root.querySelectorAll('.tl__icon')];
    if (!icons.length) return;
    const pts = icons.map(i => {
      const r = i.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    });
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    // плавная волна: между иконками линия отклоняется то влево, то вправо
    let d = `M${pts[0][0]} ${pts[0][1] - 40} L${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const sway = (i % 2 ? 1 : -1) * Math.min(90, box.width * 0.28);
      const my = (y0 + y1) / 2;
      d += ` C${x0 + sway} ${y0 + 20}, ${x1 + sway} ${my}, ${(x0 + x1) / 2 + sway * 0.5} ${my}`;
      d += ` S${x1} ${y1 - 20}, ${x1} ${y1}`;
    }
    const last = pts[pts.length - 1];
    d += ` L${last[0]} ${last[1] + 40}`;
    path.setAttribute('d', d);
    len = Math.ceil(path.getTotalLength());
    svg.style.setProperty('--len', len);
    update();
  }

  function update() {
    ticking = false;
    if (reduce()) { svg.style.setProperty('--p', 1); return; }
    const r = root.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height)));
    svg.style.setProperty('--p', p.toFixed(4));
  }

  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', layout);
  document.fonts?.ready.then(layout);
  document.fonts?.addEventListener('loadingdone', layout);   // шрифты страницы догружаются после открытия
  layout();
  return { layout };
}
