// Unit tests for the home "Latest entries" feed assembly in
// `src/lib/latest-entries.ts`. The strong guard against a dropped feed
// kind is the all-three-keys `byKind` parameter (a compile error, caught
// by `astro check` in verify:fast) — these tests cover the runtime
// behaviour that types can't: two-per-kind selection, newest-first within
// each kind, the work → piece → note grouping order, and the
// fewer-than-two case.

import { describe, expect, it } from 'vitest';
import { buildLatest, LATEST_KINDS, LATEST_PER_KIND } from '../../src/lib/latest-entries';

// Minimal stand-in for a CollectionEntry — buildLatest is generic over
// `{ data: { date } }`, so the test doesn't need the real content layer.
const entry = (id: string, date: string) => ({ id, data: { date: new Date(date) } });

describe('buildLatest', () => {
  it('takes the latest two of each kind, newest-first within each, grouped work → piece → note', () => {
    const result = buildLatest({
      note: [entry('n1', '2026-05-18'), entry('n2', '2026-05-14'), entry('n-old', '2026-01-01')],
      work: [entry('w1', '2026-05-01'), entry('w2', '2026-04-01'), entry('w-old', '2026-01-01')],
      piece: [entry('p1', '2026-05-10'), entry('p2', '2026-04-02')],
    });
    expect(result.map((r) => r.entry.id)).toEqual(['w1', 'w2', 'p1', 'p2', 'n1', 'n2']);
    expect(result.map((r) => r.kind)).toEqual(['work', 'work', 'piece', 'piece', 'note', 'note']);
  });

  it('groups by kind in LATEST_KINDS order, not by global date', () => {
    // The note is the newest entry, but grouping still leads with work.
    const result = buildLatest({
      note: [entry('n', '2026-01-03')],
      work: [entry('w', '2026-01-01')],
      piece: [entry('p', '2026-01-02')],
    });
    expect(result.map((r) => r.kind)).toEqual([...LATEST_KINDS]);
    expect(result.map((r) => r.entry.id)).toEqual(['w', 'p', 'n']);
  });

  it('caps each kind at LATEST_PER_KIND', () => {
    const many = Array.from({ length: LATEST_PER_KIND + 3 }, (_, i) =>
      entry(`n${i}`, `2026-02-${String(i + 1).padStart(2, '0')}`),
    );
    const result = buildLatest({ note: many, work: [], piece: [] });
    expect(result).toHaveLength(LATEST_PER_KIND);
  });

  it('contributes only what a sparse kind has (no padding)', () => {
    const result = buildLatest({
      note: [entry('n', '2026-01-01')],
      work: [],
      piece: [entry('p', '2026-05-27')],
    });
    // work is empty, so it drops out entirely; order stays piece → note.
    expect(result.map((r) => r.kind)).toEqual(['piece', 'note']);
    expect(result.map((r) => r.entry.id)).toEqual(['p', 'n']);
  });

  it('breaks same-date ties deterministically by id', () => {
    // Two notes share a date. Regardless of input order, the lower id
    // sorts first — so the feed is stable across builds (getCollection
    // order is not guaranteed). Assert both input orders agree.
    const a = entry('a-note', '2026-06-01');
    const b = entry('b-note', '2026-06-01');
    const forward = buildLatest({ note: [a, b], work: [], piece: [] });
    const reversed = buildLatest({ note: [b, a], work: [], piece: [] });
    expect(forward.map((r) => r.entry.id)).toEqual(['a-note', 'b-note']);
    expect(reversed.map((r) => r.entry.id)).toEqual(['a-note', 'b-note']);
  });

  it('honours an explicit perKind override', () => {
    const result = buildLatest(
      {
        note: [entry('n1', '2026-05-18'), entry('n2', '2026-05-14')],
        work: [entry('w1', '2026-05-01'), entry('w2', '2026-04-01')],
        piece: [entry('p1', '2026-05-10'), entry('p2', '2026-04-02')],
      },
      1,
    );
    expect(result.map((r) => r.entry.id)).toEqual(['w1', 'p1', 'n1']);
  });

  it('declares note, work, and piece as feed kinds', () => {
    expect([...LATEST_KINDS].sort()).toEqual(['note', 'piece', 'work']);
  });
});
