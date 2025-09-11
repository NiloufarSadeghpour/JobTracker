// src/themeBoot.js
(function () {
  try {
    const saved = localStorage.getItem('theme') || 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (saved === 'system' && prefersDark);
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    root.style.setProperty('--theme-ready', '1'); // signal ready (optional)
  } catch { /* ignore */ }
})();
