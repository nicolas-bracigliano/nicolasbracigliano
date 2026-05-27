// Unit tests for the home "Latest entries" feed assembly in
// `src/lib/latest-entries.ts`. The strong guard against a dropped feed
// kind is the `Record<LatestKind, …>` parameter (a compile error, caught
// by `astro check` in verify:fast) — these tests cover the runtime
// behaviour that types can't: the sort, the cap, and that a recent piece
// actually surfaces (the regression flagged in the PR #83 review).

import { describe, expect, it } from 'vitest';
import { buildLatest, LATEST_KINDS, LATEST_LIMIT } from '../../src/lib/latest-entries';

// Minimal stand-in for a CollectionEntry — buildLatest is generic over
// `{ data: { date } }`, so the test doesn't need the real content layer.
const entry = (id: string, date: string) => ({ id, data: { date: new Date(date) } });

describe('buildLatest', () => {
  it('merges all kinds newest-first', () => {
    const result = buildLatest({
      note: [entry('n-old', '2026-01-01'), entry('n-new', '2026-05-01')],
      work: [entry('w', '2026-03-01')],
      piece: [entry('p', '2024-08-01')],
    });
    expect(result.map((r) => r.entry.id)).toEqual(['n-new', 'w', 'n-old', 'p']);
    expect(result.map((r) => r.kind)).toEqual(['note', 'work', 'note', 'piece']);
  });

  it('caps the feed at LATEST_LIMIT', () => {
    const many = Array.from({ length: LATEST_LIMIT + 4 }, (_, i) =>
      entry(`n${i}`, `2026-02-${String(i + 1).padStart(2, '0')}`),
    );
    const result = buildLatest({ note: many, work: [], piece: [] });
    expect(result).toHaveLength(LATEST_LIMIT);
  });

  it('lets a recent piece into the feed (pieces participate)', () => {
    // The PR #83 review flagged this exact behaviour as unguarded: a
    // newly-dated piece must reach the feed, not be filtered to notes/works.
    const result = buildLatest({
      note: [entry('n', '2026-01-01')],
      work: [entry('w', '2026-01-02')],
      piece: [entry('p', '2026-05-27')],
    });
    expect(result[0]).toMatchObject({ kind: 'piece' });
    expect(result.some((r) => r.kind === 'piece')).toBe(true);
  });

  it('declares note, work, and piece as feed kinds', () => {
    expect([...LATEST_KINDS].sort()).toEqual(['note', 'piece', 'work']);
  });
});
