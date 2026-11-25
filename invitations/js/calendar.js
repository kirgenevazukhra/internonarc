// Календарь месяца события: неделя с понедельника, день события обведён сердцем.
const HEART = 'M23 40C10 31 4 24 4 16.5 4 10 9 6 14 6c4 0 7 2.5 9 6 2-3.5 5-6 9-6 5 0 10 4 10 10.5C42 24 36 31 23 40c-1 .7-2 .3-3-.6';

export function renderCalendar(grid, monthEl, yearEl, year, month, day, months, weekdays) {
  monthEl.textContent = months[month - 1];
  yearEl.textContent = year;

  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;          // 0 = понедельник
  const daysIn = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = weekdays.map(w => cell('cal__wd', w));
  for (let i = 0; i < offset; i++) cells.push(cell('cal__d is-off', ''));
  for (let d = 1; d <= daysIn; d++) {
    const c = cell('cal__d' + (d === day ? ' is-day' : ''), d);
    if (d === day) {
      c.setAttribute('aria-current', 'date');
      c.insertAdjacentHTML('beforeend',
        `<svg class="cal__heart" viewBox="0 0 46 46" aria-hidden="true"><path d="${HEART}"/></svg>`);
    }
    cells.push(c);
  }
  grid.replaceChildren(...cells);

  const path = grid.querySelector('.cal__heart path');
  if (path) path.style.setProperty('--len', Math.ceil(path.getTotalLength()));
}

function cell(cls, text) {
  const el = document.createElement('span');
  el.className = cls; el.textContent = text;
  return el;
}
