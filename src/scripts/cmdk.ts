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
import { navigate } from 'astro:transitions/client';
import type { CmdkEntry, CmdkKind } from '@lib/cmdk-index';

const DEFAULT_MAX = 8;
const QUERY_MAX = 12;
const KIND_ORDER: Record<CmdkKind, number> = { page: 0, now: 1, work: 2, piece: 3, note: 4 };

let lastFocused: HTMLElement | null = null;
let results: CmdkEntry[] = [];
let active = 0;
let seq = 0;

const overlay = (): HTMLElement | null => document.querySelector('[data-cmdk]');
const els = (root: HTMLElement) => ({
  input: root.querySelector<HTMLInputElement>('[data-cmdk-input]'),
  list: root.querySelector<HTMLElement>('[data-cmdk-list]'),
});

// One fetch per locale index URL, cached for the session.
const indexCache = new Map<string, Promise<CmdkEntry[]>>();
function loadIndex(root: HTMLElement): Promise<CmdkEntry[]> {
  const src = root.dataset.cmdkSrc;
  if (!src) return Promise.resolve([]);
  // `trailingSlash: 'always'` makes the dev server serve this `.json`
  // endpoint at `/x.json/`, while the production build emits `/x.json`.
  // import.meta.env.DEV is replaced at build time, so each bundle requests
  // the form its own server answers — correct in dev and prod, no 404.
  const url = import.meta.env.DEV ? `${src}/` : src;
  let cached = indexCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((r): Promise<CmdkEntry[]> | CmdkEntry[] =>
        r.ok ? (r.json() as Promise<CmdkEntry[]>) : [],
      )
      .catch((): CmdkEntry[] => []);
    indexCache.set(url, cached);
  }
  return cached;
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

// All chars of `q` appear in `hay` in order — a forgiving fuzzy fallback.
function subsequence(hay: string, q: string): boolean {
  let i = 0;
  for (let h = 0; h < hay.length && i < q.length; h++) {
    if (hay[h] === q[i]) i++;
  }
  return i === q.length;
}

function score(e: CmdkEntry, q: string): number {
  const title = e.title.toLowerCase();
  const hay = `${title} ${e.sub.toLowerCase()} ${e.tags.join(' ')}`;
  const ti = title.indexOf(q);
  if (ti === 0) return 100;
  if (ti > 0) return 90 - Math.min(ti, 40);
  if (hay.includes(q)) return 60;
  if (subsequence(title, q)) return 40;
  if (subsequence(hay, q)) return 20;
  return 0;
}

function match(index: CmdkEntry[], rawQuery: string): CmdkEntry[] {
  const q = rawQuery.trim().toLowerCase();
  if (q === '') return index.filter((e) => e.kind === 'page').slice(0, DEFAULT_MAX);
  return index
    .map((e) => ({ e, s: score(e, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => KIND_ORDER[a.e.kind] - KIND_ORDER[b.e.kind] || b.s - a.s)
    .slice(0, QUERY_MAX)
    .map((r) => r.e);
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
}

// Load (cached) then match the current query and repaint. A monotonic
// ticket drops a stale load if a newer keystroke superseded it.
async function refresh(root: HTMLElement): Promise<void> {
  const ticket = ++seq;
  const { input } = els(root);
  if (!input) return;
  const index = await loadIndex(root);
  if (ticket !== seq) return;
  results = match(index, input.value);
  paint(root);
}

function open(): void {
  const root = overlay();
  if (!root || !root.hidden) return;
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  root.hidden = false;
  document.documentElement.classList.add('cmdk-scroll-lock');
  applyAria(root);
  const { input } = els(root);
  if (input) {
    input.value = '';
    input.focus();
  }
  void refresh(root);
}

function close(): void {
  const root = overlay();
  if (!root || root.hidden) return;
  root.hidden = true;
  document.documentElement.classList.remove('cmdk-scroll-lock');
  seq++; // cancel any in-flight refresh
  lastFocused?.focus();
  lastFocused = null;
}

function openEntry(e: CmdkEntry | undefined): void {
  if (!e) return;
  if (/^https?:\/\//.test(e.url)) {
    window.open(e.url, '_blank', 'noopener');
    close();
    return;
  }
  close();
  void navigate(e.url);
}

// ── document-level wiring (attached once; survives ClientRouter swaps) ──

document.addEventListener('keydown', (ev) => {
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
document.addEventListener('mousemove', (ev) => {
  const root = overlay();
  if (!root || root.hidden) return;
  if (!(ev.target instanceof HTMLElement)) return;
  const item = ev.target.closest<HTMLElement>('.cmdk-item');
  if (item?.dataset.index) setActive(root, Number(item.dataset.index));
});
