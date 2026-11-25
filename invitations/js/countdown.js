// Обратный отсчёт до начала события в часовом поясе события (Казахстан: +05:00).
export function createCountdown(root, cfg) {
  const target = new Date(`${cfg.date}T${cfg.time_start}:00${cfg.timezone_offset || '+05:00'}`).getTime();
  let units = [], doneText = '', timer = null, nums = [];

  function build() {
    if (!root) return;
    root.replaceChildren(...units.map(u => {
      const item = document.createElement('div'); item.className = 'cd__item';
      item.innerHTML = '<span class="cd__num">00</span><span class="cd__unit"></span>';
      item.lastChild.textContent = u;
      return item;
    }));
    nums = [...root.querySelectorAll('.cd__num')];
    tick();
  }

  function tick() {
    if (!root) return;
    const diff = target - Date.now();
    if (diff <= 0) {
      clearInterval(timer);
      root.innerHTML = '<p class="cd__done"></p>';
      root.firstChild.textContent = doneText;
      return;
    }
    const s = Math.floor(diff / 1000);
    const vals = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    vals.forEach((v, i) => { if (nums[i]) nums[i].textContent = String(v).padStart(2, '0'); });
  }

  return {
    setTexts(u, done) { units = u; doneText = done; build(); },
    start() { clearInterval(timer); timer = setInterval(tick, 1000); tick(); },
  };
}
