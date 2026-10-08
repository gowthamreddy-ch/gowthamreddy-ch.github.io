(() => {
  const key = 'gowtham-portfolio-appearance';
  const valid = ['system', 'light', 'dark'];
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const readPreference = (fallback = 'system') => {
    try {
      const saved = localStorage.getItem(key);
      return valid.includes(saved) ? saved : 'system';
    } catch { return fallback; }
  };
  let preference = readPreference();
  const apply = () => {
    document.documentElement.dataset.theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.appearance = preference;
    const select = document.getElementById('appearance');
    if (select) select.value = preference;
  };
  apply();
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('pageshow', () => {
    preference = readPreference(preference);
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = readPreference(preference);
      apply();
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('appearance');
    if (!select) return;
    select.value = preference;
    select.addEventListener('change', () => {
      preference = valid.includes(select.value) ? select.value : 'system';
      try { localStorage.setItem(key, preference); } catch { /* Apply for this page. */ }
      apply();
    });
  });
})();
