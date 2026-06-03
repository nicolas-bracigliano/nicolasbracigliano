// Single source of truth for the ⌘K command palette's index. Built at
// build time from the same content collections the routes render from
// (notes / works / pieces) plus the static route list — so there is no
// separate index to maintain. `src/pages/cmdk/[lang].json.ts` prerenders
// the result as a per-locale JSON endpoint; `src/scripts/cmdk.ts` fetches
// it on first open and matches against it.
//
// This is *navigation, not full-text search* (design-system §-command
// palette): at this scale a reader scans faster than they search, so we
// index titles, ledes/decks, and tags only. Full-text (Pagefind) is a
// future "search everything" mode that can slot into the same UI.
//
// Not unit-testable in plain vitest (imports the `astro:content` virtual
// module); covered by the e2e in tests/e2e/cmdk.spec.ts.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { ROUTES, type Locale } from './routes';
import { assertNowEntry } from './now-items';
// Types + matching live in the Astro-free `cmdk-match` so the ranking is
// unit-testable; this module just assembles the entries.
import type { CmdkEntry, CmdkKind } from './cmdk-match';

// The static routes, in nav order. Titles match the chrome nav labels;
// decks are terse route descriptors.
const PAGES: ReadonlyArray<{
  key: keyof typeof ROUTES;
  en: { title: string; deck: string };
  es: { title: string; deck: string };
}> = [
  {
    key: 'home',
    en: { title: 'home', deck: 'the workbench' },
    es: { title: 'inicio', deck: 'la mesa de trabajo' },
  },
  {
    key: 'notes',
    en: { title: 'notes', deck: 'short field-log entries' },
    es: { title: 'notas', deck: 'garabateando en público' },
  },
  {
    key: 'works',
    en: { title: 'works', deck: 'catalog of made things' },
    es: { title: 'obras', deck: 'catálogo de cosas hechas' },
  },
  {
    key: 'pieces',
    en: { title: 'pieces', deck: 'longer arguments' },
    es: { title: 'ensayos', deck: 'argumentos más largos' },
  },
  {
    key: 'about',
    en: { title: 'about', deck: "who's on the other end" },
    es: { title: 'sobre', deck: 'quién está del otro lado' },
  },
  {
    key: 'now',
    en: { title: 'now', deck: "what I'm doing this week" },
    es: { title: 'ahora', deck: 'en qué ando esta semana' },
  },
  {
    key: 'colophon',
    en: { title: 'colophon', deck: 'how this site is made' },
    es: { title: 'colofón', deck: 'cómo está hecho este sitio' },
  },
];

const year = (d: Date): string => String(d.getUTCFullYear());
const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }): number =>
  +b.data.date - +a.data.date;

/** Assemble the palette index for one locale: routes first (the default
 *  "jump to" list), then works, pieces, notes — newest first within each.
 *  The client groups/sorts on query; this is just the source order. */
export async function buildCmdkIndex(locale: Locale): Promise<CmdkEntry[]> {
  const pages: CmdkEntry[] = PAGES.map((p) => ({
    kind: 'page',
    title: p[locale].title,
    sub: p[locale].deck,
    meta: '',
    url: ROUTES[p.key][locale],
    tags: [],
  }));

  const published = <E extends { data: { lang: Locale; status: string } }>(e: E): boolean =>
    e.data.lang === locale && e.data.status === 'published';

  // The /now bench items (coffee, guitar, garden, reading…). They live in
  // the page body, so they wouldn't surface from titles/ledes/tags alone —
  // index each one with its craft `kind` as a tag and its `where` eyebrow as
  // the subtitle, so a topical search ("coffee", "borges") jumps to /now.
  const nowEntry = await getEntry('pages', `${locale}/now`);
  const nowItems: CmdkEntry[] = [];
  if (nowEntry) {
    assertNowEntry(nowEntry);
    for (const it of nowEntry.data.items) {
      nowItems.push({
        kind: 'now',
        title: it.title,
        sub: it.where,
        meta: '',
        url: ROUTES.now[locale],
        tags: [it.kind],
      });
    }
  }

  const [notes, works, pieces] = await Promise.all([
    getCollection('notes', published),
    getCollection('works', published),
    getCollection('pieces', published),
  ]);

  const map =
    (kind: CmdkKind, routeKey: keyof typeof ROUTES) =>
    (e: CollectionEntry<'notes' | 'works' | 'pieces'>): CmdkEntry => ({
      kind,
      title: e.data.title,
      sub: e.data.lede ?? '',
      meta: year(e.data.date),
      url: `${ROUTES[routeKey][locale]}${e.data.slug}/`,
      tags: e.data.tags,
    });

  return [
    ...pages,
    ...nowItems,
    ...works.sort(byDateDesc).map(map('work', 'works')),
    ...pieces.sort(byDateDesc).map(map('piece', 'pieces')),
    ...notes.sort(byDateDesc).map(map('note', 'notes')),
  ];
}
