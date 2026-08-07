// ⌘K command palette client. Fetches the per-locale index
// (/cmdk/<locale>.json, built from the content collections) once on first
// open and caches it, then matches against it (substring, then a forgiving
// subsequence fallback) and renders a keyboard-driven listbox.
//
// Bound via document-level listeners + event delegation rather than
// per-element binding, so it survives <ClientRouter /> body swaps without
// re-init: the handlers query the live DOM (overlay, triggers) at
// interaction time. The module is hoisted (loads once); these listeners
// persist for the session. See the design-system command-palette section.
// That querying is per-interaction and cheap except on `mousemove`, which
// fires for the whole session whether or not the palette is up — hence the
// `isOpen` fast negative below.
import { navigate } from 'astro:transitions/client';
import { match, type CmdkEntry, type CmdkKind } from '@lib/cmdk-match';

let lastFocused: HTMLElement | null = null;
let results: CmdkEntry[] = [];
let active = 0;
let seq = 0;

// Fast negative for the hot path. `false` means "definitely closed", which
// lets `mousemove` bail on a property read instead of a querySelector 60–120
// times a second for the entire session. Deliberately *not* the source of
// truth: the `root.hidden` check still runs behind it, because a
// <ClientRouter /> swap can retire an open overlay and mount a fresh hidden
// one without close() ever running. That leaves the flag stale-*true*, which
// costs one wasted query per move — the pre-change behaviour — and breaks
// nothing. Caching the element instead would go stale in the dangerous
// direction: a detached node the handlers keep addressing after the first
// client-side navigation, and the palette silently stops responding.
let isOpen = false;

const overlay = (): HTMLElement | null => document.querySelector('[data-cmdk]');
const els = (root: HTMLElement) => ({
  input: root.querySelector<HTMLInputElement>('[data-cmdk-input]'),
  list: root.querySelector<HTMLElement>('[data-cmdk-list]'),
});

// One fetch per locale index URL, cached for the session. `null` means the
// index couldn't be loaded (vs. an empty result set) — surfaced as the
// "unavailable" notice rather than a misleading "no matches".
const indexCache = new Map<string, Promise<CmdkEntry[] | null>>();
async function fetchFirst(urls: readonly string[]): Promise<CmdkEntry[] | null> {
  for (const url of urls) {
    try {
      const r = await fetch(url);
      // Boundary cast: the index is our own prerendered, schema-built
      // endpoint (src/pages/cmdk/{en,es}.json.ts), so trust its shape rather
      // than re-validating every entry at runtime.
      if (r.ok) return (await r.json()) as CmdkEntry[];
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

function loadIndex(root: HTMLElement): Promise<CmdkEntry[] | null> {
  const src = root.dataset.cmdkSrc;
  if (!src) return Promise.resolve(null);
  let cached = indexCache.get(src);
  if (!cached) {
    // Static `.json` endpoints serve at `/x.json` in both dev and build.
    // Keep the slash form as a defensive fallback so a future routing
    // config change degrades to one extra request, not a silent break.
    const candidates = [src, `${src}/`];
    cached = fetchFirst(candidates).then((r) => {
      if (r === null) indexCache.delete(src); // don't cache a failure — let it retry
      return r;
    });
    indexCache.set(src, cached);
  }
  return cached;
}

// Warm the index on intent (modifier key down, or hovering/focusing a
// trigger) so the first open paints without waiting on the fetch.
function prefetch(): void {
  const root = overlay();
  if (root) void loadIndex(root);
}

// The combobox/listbox ARIA is applied here (not in the static markup) so
// it exists only once JS has wired the widget — see CommandPalette.astro.
function applyAria(root: HTMLElement): void {
  const { input, list } = els(root);
  input?.setAttribute('role', 'combobox');
  input?.setAttribute('aria-expanded', 'true');
  input?.setAttribute('aria-controls', 'cmdk-listbox');
  input?.setAttribute('aria-autocomplete', 'list');
  list?.setAttribute('role', 'listbox');
  const label = root.dataset.cmdkListlabel;
  if (list && label) list.setAttribute('aria-label', label);
}

function pillLabel(kind: CmdkKind, locale: string): string {
  const en: Record<CmdkKind, string> = {
    page: 'page',
    now: 'now',
    note: 'note',
    piece: 'piece',
    work: 'work',
  };
  const es: Record<CmdkKind, string> = {
    page: 'página',
    now: 'ahora',
    note: 'nota',
    piece: 'ensayo',
    work: 'obra',
  };
  return (locale === 'es' ? es : en)[kind];
}

function setActive(root: HTMLElement, next: number): void {
  const { input, list } = els(root);
  if (!input || !list) return;
  const items = list.querySelectorAll<HTMLElement>('.cmdk-item');
  if (items.length === 0) {
    input.removeAttribute('aria-activedescendant');
    return;
  }
  active = Math.max(0, Math.min(next, items.length - 1));
  items.forEach((it, i) => {
    const on = i === active;
    it.classList.toggle('active', on);
    it.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) {
      input.setAttribute('aria-activedescendant', it.id);
      it.scrollIntoView({ block: 'nearest' });
    }
  });
}

function announce(root: HTMLElement, text: string): void {
  const status = root.querySelector('[data-cmdk-status]');
  if (status) status.textContent = text;
}

function countLabel(root: HTMLElement, n: number): string {
  const noun = n === 1 ? root.dataset.cmdkResultOne : root.dataset.cmdkResultMany;
  return `${n} ${noun ?? ''}`.trim();
}

// Plain-text notice (the unavailable state) — distinct from the no-matches
// state, which echoes the query.
function renderNotice(root: HTMLElement, text: string): void {
  const { input, list } = els(root);
  if (!input || !list) return;
  list.replaceChildren();
  const notice = document.createElement('div');
  notice.className = 'cmdk-empty';
  notice.textContent = text;
  list.append(notice);
  input.removeAttribute('aria-activedescendant');
}

function paint(root: HTMLElement): void {
  const { input, list } = els(root);
  if (!input || !list) return;
  const locale = root.dataset.cmdkLocale ?? 'en';
  list.replaceChildren();

  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cmdk-empty';
    empty.append(root.dataset.cmdkEmpty ?? 'No matches for ');
    const em = document.createElement('em');
    em.textContent = input.value.trim();
    empty.append(em);
    list.append(empty);
    input.removeAttribute('aria-activedescendant');
    announce(root, `${root.dataset.cmdkEmpty ?? ''}${input.value.trim()}`);
    return;
  }

  results.forEach((e, i) => {
    const item = document.createElement('div');
    item.className = 'cmdk-item';
    item.id = `cmdk-opt-${i}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.dataset.url = e.url;
    item.dataset.index = String(i);

    const pill = document.createElement('span');
    pill.className = `cmdk-pill k-${e.kind}`;
    pill.textContent = pillLabel(e.kind, locale);
    item.append(pill);

    const text = document.createElement('div');
    text.className = 'cmdk-text';
    const title = document.createElement('span');
    title.className = 'cmdk-title';
    title.textContent = e.title;
    text.append(title);
    if (e.sub) {
      const sub = document.createElement('span');
      sub.className = 'cmdk-sub';
      sub.textContent = e.sub;
      text.append(sub);
    }
    item.append(text);

    if (e.meta) {
      const meta = document.createElement('span');
      meta.className = 'cmdk-meta';
      meta.textContent = e.meta;
      item.append(meta);
    }
    list.append(item);
  });

  setActive(root, 0);
  announce(root, countLabel(root, results.length));
}

// Load (cached) then match the current query and repaint. A monotonic
// ticket drops a stale load if a newer keystroke superseded it.
async function refresh(root: HTMLElement): Promise<void> {
  const ticket = ++seq;
  const { input } = els(root);
  if (!input) return;
  const index = await loadIndex(root);
  if (ticket !== seq) return;
  if (index === null) {
    results = [];
    const msg = root.dataset.cmdkUnavailable ?? '';
    renderNotice(root, msg);
    announce(root, msg);
    return;
  }
  results = match(index, input.value);
  paint(root);
}

// While the palette is open, make everything except it inert and lock body
// scroll — so keyboard and screen-reader focus can't wander the page behind
// the modal (`aria-modal` alone isn't reliably honored). The scrollbar
// width is reserved as padding so locking doesn't shift the layout.
function setShell(root: HTMLElement, isOpen: boolean): void {
  const docEl = document.documentElement;
  if (isOpen) docEl.style.setProperty('--cmdk-sbw', `${window.innerWidth - docEl.clientWidth}px`);
  else docEl.style.removeProperty('--cmdk-sbw');
  docEl.classList.toggle('cmdk-scroll-lock', isOpen);
  for (const el of Array.from(document.body.children)) {
    if (el === root || el.tagName === 'SCRIPT') continue;
    el.toggleAttribute('inert', isOpen);
  }
}

function open(): void {
  const root = overlay();
  if (!root || !root.hidden) return;
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  root.hidden = false;
  isOpen = true;
  setShell(root, true);
  applyAria(root);
  const { input } = els(root);
  if (input) {
    input.value = '';
    input.focus();
  }
  void refresh(root);
}

function close(): void {
  // Ahead of the guard: whichever branch runs, the palette is not open once
  // this returns. Clearing it after the early-out would strand the flag on
  // `true` when a swap has already taken the overlay out from under us.
  isOpen = false;
  const root = overlay();
  if (!root || root.hidden) return;
  // Lift inert before restoring focus, so the trigger is focusable again.
  setShell(root, false);
  root.hidden = true;
  seq++; // cancel any in-flight refresh
  lastFocused?.focus();
  lastFocused = null;
}

// Every indexed entry is in-site today (the works schema has no external
// link field — see the design-system command-palette section). When one
// is added, branch here on an absolute URL to open it in a new tab.
function openEntry(e: CmdkEntry | undefined): void {
  if (!e) return;
  close();
  void navigate(e.url);
}

// ── document-level wiring (attached once; survives ClientRouter swaps) ──

document.addEventListener('keydown', (ev) => {
  // Warm the index the moment the modifier goes down, before "k" arrives.
  if (ev.key === 'Meta' || ev.key === 'Control') {
    prefetch();
    return;
  }
  // Toggle from anywhere.
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
    ev.preventDefault();
    const root = overlay();
    if (root?.hidden === false) close();
    else open();
    return;
  }
  const root = overlay();
  if (!root || root.hidden) return;

  switch (ev.key) {
    case 'Escape':
      ev.preventDefault();
      close();
      break;
    case 'ArrowDown':
      ev.preventDefault();
      setActive(root, active + 1);
      break;
    case 'ArrowUp':
      ev.preventDefault();
      setActive(root, active - 1);
      break;
    case 'Enter':
      ev.preventDefault();
      openEntry(results[active]);
      break;
    case 'Tab':
      // Single focusable (the input) — trap focus inside the dialog.
      ev.preventDefault();
      break;
  }
});

document.addEventListener('input', (ev) => {
  const root = overlay();
  if (!root || root.hidden) return;
  if (ev.target instanceof HTMLElement && ev.target.matches('[data-cmdk-input]'))
    void refresh(root);
});

document.addEventListener('click', (ev) => {
  if (!(ev.target instanceof HTMLElement)) return;
  const target = ev.target;

  if (target.closest('[data-cmdk-open]')) {
    ev.preventDefault();
    open();
    return;
  }

  const root = overlay();
  if (!root || root.hidden) return;

  // Backdrop click (the overlay itself, not the panel) closes.
  if (target === root) {
    close();
    return;
  }

  const item = target.closest<HTMLElement>('.cmdk-item');
  if (item?.dataset.index) {
    openEntry(results[Number(item.dataset.index)]);
  }
});

// Hover sets the active row (pointer + keyboard share one highlight).
// The `isOpen` gate is the only listener that needs one: every other
// document-level handler here fires per discrete interaction, while this one
// fires continuously any time the pointer moves and the palette is closed for
// nearly all of it. Keyboard-driven `open()` must still work from a cold
// flag, so `keydown` and `click` stay ungated by construction.
document.addEventListener('mousemove', (ev) => {
  if (!isOpen) return;
  const root = overlay();
  if (!root || root.hidden) return;
  if (!(ev.target instanceof HTMLElement)) return;
  const item = ev.target.closest<HTMLElement>('.cmdk-item');
  if (item?.dataset.index) setActive(root, Number(item.dataset.index));
});

// Warm the index when a trigger is hovered or focused, so a click/Enter
// opens to a painted list. (pointerover/focusin bubble; closest filters.)
function prefetchOnTriggerIntent(ev: Event): void {
  if (ev.target instanceof HTMLElement && ev.target.closest('[data-cmdk-open]')) prefetch();
}
document.addEventListener('pointerover', prefetchOnTriggerIntent);
document.addEventListener('focusin', prefetchOnTriggerIntent);
