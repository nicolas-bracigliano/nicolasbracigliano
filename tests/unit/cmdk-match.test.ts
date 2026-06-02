import { describe, expect, it } from 'vitest';
import { match, score, subsequence, DEFAULT_MAX, type CmdkEntry } from '../../src/lib/cmdk-match';

const entry = (over: Partial<CmdkEntry> & Pick<CmdkEntry, 'kind' | 'title'>): CmdkEntry => ({
  sub: '',
  meta: '',
  url: '/x/',
  tags: [],
  ...over,
});

describe('subsequence', () => {
  it('matches in-order character runs and rejects out-of-order', () => {
    expect(subsequence('colophon', 'clphn')).toBe(true);
    expect(subsequence('colophon', 'colophon')).toBe(true);
    expect(subsequence('colophon', 'nopal')).toBe(false); // out of order
    expect(subsequence('catch-all tray', 'coffee')).toBe(false); // no 'o'/'ff'
  });
});

describe('score', () => {
  const e = entry({
    kind: 'page',
    title: 'colophon',
    sub: 'how this site is made',
    tags: ['meta'],
  });

  it('ranks title-prefix above title-substring above sub/tag-substring', () => {
    expect(score(entry({ kind: 'page', title: 'colophon' }), 'colo')).toBe(100);
    expect(score(entry({ kind: 'page', title: 'the colophon' }), 'colo')).toBeLessThan(100);
    expect(score(entry({ kind: 'page', title: 'the colophon' }), 'colo')).toBeGreaterThan(60);
    expect(score(e, 'made')).toBe(60); // only in the subtitle
    expect(score(e, 'meta')).toBe(60); // only in tags
  });

  it('uses the title-only subsequence fallback, not the whole haystack', () => {
    // "coffee" lives in a now item's sub/tag → substring tier, scores.
    const coffeeNow = entry({
      kind: 'now',
      title: 'Padre Ethiopia, and Cruz de Malta',
      sub: 'in the cup · coffee + mate',
      tags: ['coffee'],
    });
    expect(score(coffeeNow, 'coffee')).toBe(60);

    // The regression: "coffee" must NOT fuzzy-match an unrelated title via
    // a haystack-wide subsequence (the old behavior surfaced these).
    expect(score(entry({ kind: 'work', title: 'Catch-all tray' }), 'coffee')).toBe(0);
    expect(score(entry({ kind: 'piece', title: 'C4, four times in a row' }), 'coffee')).toBe(0);

    // Typo tolerance still works against the title.
    expect(score(entry({ kind: 'page', title: 'colophon' }), 'clophn')).toBe(30);
  });
});

describe('match', () => {
  const index: CmdkEntry[] = [
    entry({ kind: 'page', title: 'home', sub: 'the workbench' }),
    entry({ kind: 'page', title: 'colophon', sub: 'how this site is made' }),
    entry({
      kind: 'now',
      title: 'Padre Ethiopia',
      sub: 'in the cup · coffee + mate',
      tags: ['coffee'],
    }),
    entry({ kind: 'work', title: 'Catch-all tray', sub: 'fits the espresso tamper' }),
    entry({ kind: 'piece', title: 'Where agile keeps getting stuck', tags: ['agile'] }),
    entry({ kind: 'note', title: 'Hello', sub: 'world' }),
  ];

  it('returns only routes (capped) for an empty query', () => {
    const r = match(index, '');
    expect(r.every((e) => e.kind === 'page')).toBe(true);
    expect(r.length).toBeLessThanOrEqual(DEFAULT_MAX);
  });

  it('surfaces the /now item for a topical query and nothing spurious', () => {
    const r = match(index, 'coffee');
    expect(r).toHaveLength(1);
    expect(r[0]?.title).toBe('Padre Ethiopia');
    expect(r[0]?.kind).toBe('now');
  });

  it('ranks an exact match ahead of a fuzzy subsequence hit in a higher kind group', () => {
    // The /now title spells "agile" only as a subsequence
    // (a·g·i·l·e in "A year in, getting louder"); the piece is an exact
    // substring match. Even though `now` groups above `piece`, the exact
    // match must come first — a fuzzy hit must not bury it.
    const idx: CmdkEntry[] = [
      entry({ kind: 'now', title: 'A year in, getting louder' }),
      entry({ kind: 'piece', title: 'Where agile keeps getting stuck', tags: ['agile'] }),
    ];
    const r = match(idx, 'agile');
    expect(r[0]?.kind).toBe('piece');
    expect(r[0]?.title).toBe('Where agile keeps getting stuck');
  });

  it('groups results page → now → work → piece → note', () => {
    // A query that hits several kinds (every title/sub contains "e"-ish
    // letters): assert the surviving order is non-decreasing by group.
    const r = match(index, 'e');
    const order = { page: 0, now: 1, work: 2, piece: 3, note: 4 } as const;
    const ranks = r.map((e) => order[e.kind]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
