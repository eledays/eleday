(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('eleday-theme'); } catch {}
  let explicit = saved === 'dark' || saved === 'light';
  const apply = theme => {
    root.dataset.theme = theme;
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.textContent = theme === 'dark' ? 'Дневной режим' : 'Ночной режим';
      button.setAttribute('aria-label', `Включить ${theme === 'dark' ? 'дневной' : 'ночной'} режим`);
    }
  };
  apply(explicit ? saved : system.matches ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      explicit = true;
      const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('eleday-theme', theme); } catch {}
      apply(theme);
    });
  });
  system.addEventListener('change', event => { if (!explicit) apply(event.matches ? 'dark' : 'light'); });
})();
