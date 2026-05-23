// Pure theme-state helpers — no DOM, no localStorage, no matchMedia.
// Imported by `chrome.ts` (which wires them up to the runtime) and by
// `tests/unit/theme.test.ts` (which exercises them in isolation).

export type Theme = 'dia' | 'noche';

/** Validate a raw localStorage value. Anything other than `'dia'` or
 *  `'noche'` is treated as no stored preference. */
export function parseStoredTheme(raw: string | null): Theme | null {
  return raw === 'dia' || raw === 'noche' ? raw : null;
}

/** Pick the theme that should be applied right now. Stored user override
 *  wins; otherwise fall back to the OS `prefers-color-scheme`. */
export function pickTheme(stored: Theme | null, prefersDark: boolean): Theme {
  return stored ?? (prefersDark ? 'noche' : 'dia');
}

/** Outcome of an OS-theme change. `apply: null` means "do nothing"
 *  (keep the existing override); `retire: true` means the stored
 *  override should be cleared because the OS just caught up to it. */
export type RetireDecision = {
  apply: Theme | null;
  retire: boolean;
};

/** Decide what to do when the OS `prefers-color-scheme` changes.
 *
 *  - No stored override → follow the OS (no retire).
 *  - Stored override matches the new OS theme → apply + retire the
 *    override so future OS toggles are followed automatically.
 *  - Stored override disagrees with the OS → keep it; user was explicit. */
export function decideOnOsChange(stored: Theme | null, osTheme: Theme): RetireDecision {
  if (stored === null) return { apply: osTheme, retire: false };
  if (stored === osTheme) return { apply: osTheme, retire: true };
  return { apply: null, retire: false };
}
