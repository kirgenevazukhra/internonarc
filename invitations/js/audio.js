// Музыка: запускается только из нажатия пользователя; если браузер отказал — сайт работает без звука,
// а кнопка позволяет включить вручную. При сворачивании вкладки — пауза.
export function createAudio(el, btn, getT) {
  let wanted = false;      // пользователь хочет музыку
  let disabled = false;

  const set = playing => { btn.setAttribute('aria-pressed', String(playing)); updateLabel(); };
  function updateLabel() {
    const t = getT();
    btn.setAttribute('aria-label', btn.getAttribute('aria-pressed') === 'true' ? t('sound_off') : t('sound_on'));
  }

  async function play() {
    if (!el || disabled) return;
    try {
      if (el.preload === 'none') { el.preload = 'auto'; el.load(); }
      el.volume = 0; await el.play(); set(true); fadeTo(0.7);
    } catch { set(false); }            // отказ браузера или файл не загрузился — просто без звука
  }
  function pause() { el?.pause(); set(false); }
  function fadeTo(v) {
    const step = () => { el.volume = Math.min(v, el.volume + 0.05); if (el.volume < v) requestAnimationFrame(step); };
    step();
  }

  el?.addEventListener('error', () => set(false));
  btn.addEventListener('click', () => { wanted = !(btn.getAttribute('aria-pressed') === 'true'); disabled = false; wanted ? play() : pause(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) el?.pause();
    else if (wanted && !disabled) el.play().then(() => set(true)).catch(() => set(false));
  });

  return {
    start() { wanted = true; play(); },
    disable() { disabled = true; },
    updateLabel,
  };
}
