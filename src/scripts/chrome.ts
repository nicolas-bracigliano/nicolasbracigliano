// Chrome client behaviour: theme state machine, foot-rail scroll-direction
// listener, FOUC prevention, cross-tab sync, click delegation. Imported
// once from BaseLayout's <script> tag; all handlers are window/document-
// level so they survive ClientRouter body swaps. Pure state helpers
// live in `./theme.ts` so they're unit-testable without a DOM.

import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';
import { decideOnOsChange, parseStoredTheme, pickTheme, THEME_COLOR, type Theme } from './theme';

const MOBILE_BREAKPOINT = '(max-width: 720px)';
const HIDE_AT_SCROLL_PX = 120;
const ALWAYS_SHOW_BELOW_PX = 60;
const DY_DEBOUNCE_PX = 5;

function readStoredTheme(): Theme | null {
  try {
    return parseStoredTheme(localStorage.getItem('theme'));
  } catch {
    return null;
  }
}

function resolveTheme(): Theme {
  return pickTheme(
    readStoredTheme(),
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  btn?.setAttribute('aria-checked', String(theme === 'noche'));
  // Keep mobile browser chrome on the active theme. `theme-init.js` sets
  // this before first paint; this covers the toggle, cross-tab `storage`
  // sync, OS-change retirement, and post-ClientRouter swaps (which replace
  // <head>, so the tag is a fresh element carrying the SSR'd Día default).
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

// Foot-rail scroll-direction handler. Only attached at mobile widths via
// matchMedia — at desktop the `.is-hidden` class has no effect anyway,
// no need to burn cycles tracking scroll direction.

let lastScrollY = window.scrollY;
let scrollTicking = false;
let scrollAttached = false;

function updateFootRailVisibility(): void {
  const rail = document.querySelector<HTMLElement>('.foot-rail');
  if (!rail) {
    scrollTicking = false;
    return;
  }
  const y = window.scrollY;
  const dy = y - lastScrollY;
  if (y > HIDE_AT_SCROLL_PX && dy > DY_DEBOUNCE_PX) {
    rail.classList.add('is-hidden');
  } else if (dy < -DY_DEBOUNCE_PX || y <= ALWAYS_SHOW_BELOW_PX) {
    rail.classList.remove('is-hidden');
  }
  lastScrollY = y;
  scrollTicking = false;
}

function onScroll(): void {
  if (scrollTicking) return;
  requestAnimationFrame(updateFootRailVisibility);
  scrollTicking = true;
}

function attachScrollListener(): void {
  if (scrollAttached) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  scrollAttached = true;
}

function detachScrollListener(): void {
  if (!scrollAttached) return;
  window.removeEventListener('scroll', onScroll);
  scrollAttached = false;
  document.querySelector<HTMLElement>('.foot-rail')?.classList.remove('is-hidden');
}

const mobileMql = window.matchMedia?.(MOBILE_BREAKPOINT);
function syncScrollListenerToBreakpoint(): void {
  if (mobileMql?.matches) attachScrollListener();
  else detachScrollListener();
}
syncScrollListenerToBreakpoint();
mobileMql?.addEventListener('change', syncScrollListenerToBreakpoint);

// Single page-load handler — theme sync + foot-rail reset. ClientRouter
// fires astro:page-load once on first load and after every navigation.
document.addEventListener('astro:page-load', () => {
  applyTheme(resolveTheme());
  lastScrollY = window.scrollY;
  document.querySelector<HTMLElement>('.foot-rail')?.classList.remove('is-hidden');
});

// ClientRouter replaces <html> attributes on swap; without this,
// data-theme is wiped for one frame and the page flashes light before
// astro:page-load re-applies the user's theme.
document.addEventListener('astro:before-swap', (event) => {
  // Boundary cast: `astro:before-swap` isn't in lib.dom's event map, so the
  // listener receives a generic `Event`; cast to Astro's typed event.
  const evt = event as TransitionBeforeSwapEvent;
  const current = document.documentElement.dataset.theme;
  if (current === 'dia' || current === 'noche') {
    evt.newDocument.documentElement.dataset.theme = current;
  }
});

window.addEventListener('storage', (event) => {
  if (event.key !== 'theme') return;
  if (event.newValue === 'dia' || event.newValue === 'noche') {
    applyTheme(event.newValue);
  } else if (event.newValue === null) {
    applyTheme(resolveTheme());
  }
});

const colorSchemeMql = window.matchMedia?.('(prefers-color-scheme: dark)');
colorSchemeMql?.addEventListener('change', (event) => {
  const osTheme: Theme = event.matches ? 'noche' : 'dia';
  const decision = decideOnOsChange(readStoredTheme(), osTheme);
  if (decision.retire) {
    try {
      localStorage.removeItem('theme');
    } catch {
      /* localStorage unavailable */
    }
  }
  if (decision.apply) applyTheme(decision.apply);
});

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;

  const themeBtn = target?.closest<HTMLButtonElement>('#theme-toggle');
  if (themeBtn) {
    const next: Theme = document.documentElement.dataset.theme === 'noche' ? 'dia' : 'noche';
    applyTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* localStorage unavailable */
    }
    return;
  }

  const langLink = target?.closest<HTMLAnchorElement>('.lang-toggle a[data-lang]');
  if (langLink) {
    if (langLink.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    try {
      localStorage.setItem('lang', langLink.dataset['lang'] ?? 'en');
    } catch {
      /* localStorage unavailable */
    }
  }
});
