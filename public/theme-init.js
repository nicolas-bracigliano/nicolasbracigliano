/* FOUC prevention: applied before paint. CSP-friendly (external file, self-hosted). */
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'noche' || t === 'dia') {
      document.documentElement.dataset.theme = t;
    }
  } catch (_) {
    /* localStorage unavailable */
  }
})();
