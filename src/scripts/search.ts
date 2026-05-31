// Pagefind-backed site search, wired up by Search.astro on the notes
// index. The prebuilt index (/_pagefind/pagefind.js) is lazy-loaded on
// first focus so the route ships no search JS until the reader engages;
// the same-origin dynamic import stays inside `script-src 'self'`.
// Results render into the component's own markup (styled by search.css) —
// no PagefindUI bundle, no inline scripts. Init runs on `astro:page-load`
// so it re-arms after each <ClientRouter /> navigation, mirroring chrome.ts.

// Pagefind ships no types and its bundle only exists after `pnpm build`
// (the postbuild step), so we describe the slice we use locally and load
// it through a dynamic import the compiler can't resolve. See loadPagefind.
interface PagefindResultData {
  /** Absolute path of the matched page, e.g. "/en/notes/hello/". */
  url: string;
  /** Pagefind's default metadata; `title` is the page <title>. */
  meta: { title?: string };
  /** Excerpt HTML with `<mark>` around matched terms — derived from the
   *  site's own indexed text, no user input. */
  excerpt: string;
}
interface PagefindResult {
  data(): Promise<PagefindResultData>;
}
interface PagefindApi {
  search(
    query: string,
    options?: { filters?: Record<string, string> },
  ): Promise<{ results: PagefindResult[] }>;
}

const PAGEFIND_URL = '/_pagefind/pagefind.js';
const MIN_QUERY = 2;
const MAX_RESULTS = 8;
const DEBOUNCE_MS = 160;

function wire(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const list = root.querySelector<HTMLElement>('[data-search-results]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  if (!input || !list || !status) return;
  // Idempotent: astro:page-load can fire against an already-wired node.
  if (root.dataset.wired === 'true') return;
  root.dataset.wired = 'true';

  const lang = root.dataset.searchLang ?? 'en';
  const msgSearching = root.dataset.msgSearching ?? '';
  const msgEmpty = root.dataset.msgEmpty ?? '';
  const msgUnavailable = root.dataset.msgUnavailable ?? '';

  let pagefind: PagefindApi | null = null;
  let loading: Promise<PagefindApi> | null = null;
  function loadPagefind(): Promise<PagefindApi> {
    if (pagefind) return Promise.resolve(pagefind);
    if (!loading) {
      // `@vite-ignore` + a variable specifier: the bundler must not try to
      // resolve /_pagefind/ at build time (it isn't there yet). The module
      // is untyped, so assert the shape we use — the one boundary cast here.
      loading = import(/* @vite-ignore */ PAGEFIND_URL).then(
        (m) => {
          pagefind = m as PagefindApi;
          return pagefind;
        },
        (err: unknown) => {
          // Don't cache the failure (e.g. the index 404s under `astro dev`,
          // or a cached non-JS response): clear it so a later attempt — or
          // a hard reload onto a real build — can retry.
          loading = null;
          throw err;
        },
      );
    }
    return loading;
  }

  const render = (results: PagefindResultData[]): void => {
    list.replaceChildren();
    status.textContent = results.length === 0 ? msgEmpty : '';
    for (const r of results) {
      const li = document.createElement('li');
      li.className = 'search-result';
      const a = document.createElement('a');
      a.href = r.url;
      a.className = 'search-result-link';
      a.textContent = r.meta.title ?? r.url;
      const excerpt = document.createElement('p');
      excerpt.className = 'search-result-excerpt';
      // Pagefind-escaped site text plus <mark> highlights — no user input.
      excerpt.innerHTML = r.excerpt;
      li.append(a, excerpt);
      list.append(li);
    }
  };

  // Monotonic ticket so a slow query can't overwrite a newer one's results.
  let seq = 0;
  const run = async (query: string): Promise<void> => {
    const ticket = ++seq;
    try {
      const pf = await loadPagefind();
      const search = await pf.search(query, { filters: { lang } });
      const results = await Promise.all(search.results.slice(0, MAX_RESULTS).map((r) => r.data()));
      if (ticket === seq) render(results);
    } catch {
      // The index didn't load — e.g. `astro dev`, where /_pagefind/ doesn't
      // exist yet. Say so explicitly rather than showing "no matches",
      // which would wrongly imply the query simply found nothing.
      if (ticket === seq) {
        list.replaceChildren();
        status.textContent = msgUnavailable;
      }
    }
  };

  let timer: number | undefined;
  input.addEventListener('input', () => {
    const query = input.value.trim();
    window.clearTimeout(timer);
    if (query.length < MIN_QUERY) {
      seq++; // cancel any in-flight render
      list.replaceChildren();
      status.textContent = '';
      return;
    }
    status.textContent = msgSearching;
    timer = window.setTimeout(() => void run(query), DEBOUNCE_MS);
  });

  // Warm the index on first focus so the first keystroke isn't blocked on
  // the network fetch. Best-effort: swallow a load failure here so it
  // doesn't surface as an unhandled rejection — run() reports it as
  // "unavailable" when the reader actually searches.
  input.addEventListener('focus', () => void loadPagefind().catch(() => {}), { once: true });
}

function setup(): void {
  const root = document.querySelector<HTMLElement>('[data-search]');
  if (root) wire(root);
}

document.addEventListener('astro:page-load', setup);
