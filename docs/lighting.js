'use strict';
(() => {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll('.lighting-picker button')];
  const status = document.getElementById('lighting-status');
  const systemPreference = matchMedia('(prefers-color-scheme: dark)');
  let mode = root.dataset.lighting || 'system';
  function update() {
    const now = new Date();
    const hour = now.getHours();
    const theme = mode === 'system' ? (systemPreference.matches ? 'dark' : 'light') : mode === 'local' ? (hour >= 7 && hour < 19 ? 'light' : 'dark') : mode;
    root.dataset.theme = theme;
    root.dataset.lighting = mode;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0b1220' : '#f7fafc';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lighting === mode)));
    if (mode === 'local') {
      let time;
      try { time = new Intl.DateTimeFormat(undefined, {hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(now); }
      catch { time = `${String(hour).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; }
      status.textContent = `Your local sky / ${time}`;
      status.title = 'Follows your device time zone. Light from 7:00 AM to 7:00 PM; dark otherwise.';
    } else if (mode === 'system') {
      status.textContent = `Your device’s appearance / ${theme === 'light' ? 'Daylight' : 'Night sky'}`;
      status.title = 'Follows your system light or dark appearance, including changes while this page is open.';
    } else {
      status.textContent = theme === 'light' ? 'A little daylight.' : 'Under a quieter sky.';
      status.title = theme === 'light' ? 'Light mode stays on until you change it.' : 'Dark mode stays on until you change it.';
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.lighting;
    try { localStorage.setItem('gr-lighting-mode', mode); } catch { /* Still works for the current visit. */ }
    update();
  }));
  window.addEventListener('storage', event => {
    if (event.key === 'gr-lighting-mode') { mode = ['light','dark','local','system'].includes(event.newValue) ? event.newValue : 'system'; update(); }
  });
  systemPreference.addEventListener('change', () => { if (mode === 'system') update(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
  // Re-check the clock so an open page changes at the next day/night boundary.
  setInterval(update, 30000);
  update();
  // Establish the correct first-paint sky before enabling reversible CSS transitions.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('sky-ready')));
})();
