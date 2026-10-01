// Theme setting for the whole site. Loaded first so pages never flash the wrong colours.
//
//   DEFAULT_THEME = 'light'  -> everyone starts in light mode
//   DEFAULT_THEME = 'dark'   -> everyone starts in dark mode
//   DEFAULT_THEME = 'auto'   -> follows each visitor's system setting
//
// A visitor who uses the moon/sun switch overrides this, and the site remembers their choice.
var DEFAULT_THEME = 'light';

(function () {
  var theme = DEFAULT_THEME;
  try { var saved = localStorage.getItem('theme'); if (saved === 'light' || saved === 'dark') theme = saved; } catch (e) {}
  if (theme === 'auto') theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
})();
