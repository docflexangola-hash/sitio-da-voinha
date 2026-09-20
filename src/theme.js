const KEY = 'sdv-theme';

const NIGHT_START = 17 * 60 + 30; // 17:30
const NIGHT_END = 5 * 60; // 05:00

function isDarkNow() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= NIGHT_START || minutes < NIGHT_END;
}

export function currentTheme() {
  const saved = localStorage.getItem(KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return isDarkNow() ? 'dark' : 'light';
}

function updateIcons(theme) {
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    const moon = btn.querySelector('[data-theme-moon]');
    const sun = btn.querySelector('[data-theme-sun]');
    if (moon) moon.classList.toggle('hidden', theme === 'dark');
    if (sun) sun.classList.toggle('hidden', theme !== 'dark');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Modo claro' : 'Modo escuro');
  });
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  updateIcons(theme);
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  return currentTheme();
}

export function initTheme() {
  applyTheme(currentTheme());
  setInterval(() => {
    if (!localStorage.getItem(KEY)) applyTheme(currentTheme());
  }, 60 * 1000);
}