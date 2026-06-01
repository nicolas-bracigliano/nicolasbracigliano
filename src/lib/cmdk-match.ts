// Pure matching/ranking for the ⌘K command palette. No Astro imports, so
// it's unit-tested directly (tests/unit/cmdk-match.test.ts) and shared by
// both the build-time index (cmdk-index.ts owns the types here) and the
// client (scripts/cmdk.ts owns the rendering). Keeping the scoring out of
// the Astro-coupled modules is what makes the ranking rules testable.

/** Matches the kind-pill classes in cmdk.css (`k-page`/`k-now`/…) and the
 *  grouping order in KIND_ORDER. */
export type CmdkKind = 'page' | 'now' | 'note' | 'piece' | 'work';

export interface CmdkEntry {
  kind: CmdkKind;
  /** Localized title (route label, or the entry's `title`). */
  title: string;
  /** One-line subtitle: a route deck, a now item's eyebrow, or the lede. */
  sub: string;
  /** Right-aligned meta (entry year; empty for routes/now). */
  meta: string;
  /** In-site destination (trailing-slash, per astro config). */
  url: string;
  /** Lowercased tags, folded into the match haystack. */
  tags: string[];
}

/** Default list cap (the routes shown for an empty query) and the on-query
 *  cap. */
export const DEFAULT_MAX = 8;
export const QUERY_MAX = 12;

/** Result grouping: routes, then current-work, then the dated streams. */
const KIND_ORDER: Record<CmdkKind, number> = { page: 0, now: 1, work: 2, piece: 3, note: 4 };

/** All chars of `q` appear in `hay` in order — a forgiving fuzzy fallback. */
export function subsequence(hay: string, q: string): boolean {
  let i = 0;
  for (let h = 0; h < hay.length && i < q.length; h++) {
    if (hay[h] === q[i]) i++;
  }
  return i === q.length;
}

/** Score one entry against an already-lowercased query. 0 = no match.
 *
 *  Tiers, strongest first: title prefix > title substring > subtitle/tag
 *  substring > title subsequence. The subsequence (typo-tolerant) fallback
 *  runs against the **title only** — running it over the whole haystack
 *  matched almost anything for short queries (e.g. "coffee" subsequence-hit
 *  "Catch-all tray"); a real "coffee" still scores via the subtitle/tag
 *  substring tier ("in the cup · coffee + mate", tag `coffee`). */
export function score(entry: CmdkEntry, q: string): number {
  const title = entry.title.toLowerCase();
  const ti = title.indexOf(q);
  if (ti === 0) return 100;
  if (ti > 0) return 90 - Math.min(ti, 40);
  if (`${entry.sub.toLowerCase()} ${entry.tags.join(' ')}`.includes(q)) return 60;
  if (subsequence(title, q)) return 30;
  return 0;
}

/** Filter + rank the index for a query. Empty query → the routes (the
 *  default "jump to" list). Otherwise: score, drop non-matches, group by
 *  kind then by score, cap. */
export function match(index: readonly CmdkEntry[], rawQuery: string): CmdkEntry[] {
  const q = rawQuery.trim().toLowerCase();
  if (q === '') return index.filter((e) => e.kind === 'page').slice(0, DEFAULT_MAX);
  return index
    .map((e) => ({ e, s: score(e, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => KIND_ORDER[a.e.kind] - KIND_ORDER[b.e.kind] || b.s - a.s)
    .slice(0, QUERY_MAX)
    .map((r) => r.e);
}
