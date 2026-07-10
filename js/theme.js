const STORAGE_KEY = 'deceptivescout-theme';

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initThemeToggle(button) {
  const current = () => document.documentElement.getAttribute('data-theme') || 'light';

  button.setAttribute('aria-pressed', String(current() === 'dark'));

  button.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
    button.setAttribute('aria-pressed', String(next === 'dark'));
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (evt) => {
      if (getStoredTheme()) return; // explicit user choice wins
      const next = evt.matches ? 'dark' : 'light';
      applyTheme(next);
      button.setAttribute('aria-pressed', String(next === 'dark'));
    });
  }
}
