/* FOUC prevention: applied before paint. CSP-friendly (external file,
 * self-hosted). Full resolution chain: localStorage → matchMedia → 'dia'.
 *
 * Kept in plain ES5 because it runs synchronously in <head> before any
 * bundler-emitted code, and we don't want to ship a Babel runtime here.
 */
(function () {
  var theme;
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'noche' || stored === 'dia') {
      theme = stored;
    }
  } catch (_) {
    /* localStorage unavailable (privacy mode, etc.) */
  }
  if (!theme && window.matchMedia) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noche' : 'dia';
  }
  theme = theme || 'dia';
  document.documentElement.dataset.theme = theme;

  /* Sync the toggle's aria-checked the moment the DOM finishes
   * parsing — the SSR ships `aria-checked="false"` (a default the
   * server can't personalise), so screen readers landing on a
   * `noche` user would otherwise hear the wrong state until
   * `chrome.ts` runs on `astro:page-load`. */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-checked', String(theme === 'noche'));
  });
})();
