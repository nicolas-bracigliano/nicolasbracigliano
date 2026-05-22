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
  document.documentElement.dataset.theme = theme || 'dia';
})();
