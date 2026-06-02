// Unit tests for `formatEntryDate` (`src/lib/format-entry-date.ts`), the
// per-kind date string for home "Latest entries" rows. The interesting
// case is the work branch: an ongoing work shows its status word instead
// of a month — logic that can't be unit-tested while inlined in an
// `.astro`, which is why the helper exists.
//
// Dates are built with the `Date(year, monthIndex, day[, hour])`
// constructor (local time) so the assertions hold regardless of the
// runner's timezone: full dates format without a timeZone (same local
// day in, same out), and the work short-month uses a mid-month noon so
// the Melbourne conversion can't cross into a neighbouring month.

import { describe, expect, it } from 'vitest';
import { formatEntryDate } from '../../src/lib/format-entry-date';

describe('formatEntryDate', () => {
  it('renders notes and pieces as a full bullet-joined date', () => {
    const date = new Date(2026, 4, 18); // 2026-05-18, local
    expect(formatEntryDate(date, { kind: 'note', locale: 'en' })).toBe('2026 · 05 · 18');
    expect(formatEntryDate(date, { kind: 'piece', locale: 'en' })).toBe('2026 · 05 · 18');
  });

  // The exact short-month string ("apr"/"abr") is ICU-locale-data and
  // depends on the runner's Node/ICU build, so assert the *contract*
  // instead: year first, " · " separator, a lowercased month with no
  // trailing dot (es-AR's "abr." gets stripped). That still pins the two
  // things that actually matter here — year-first ordering (where this
  // diverges from WorkCard) and the lowercase/dot handling.
  const YEAR_FIRST_MONTH = /^2026 · \p{Ll}{3,}$/u;

  it('renders a non-ongoing work as year-first + lowercase short month', () => {
    const date = new Date(2026, 3, 15, 12); // mid-April, noon
    expect(formatEntryDate(date, { kind: 'work', lifecycle: 'shipping', locale: 'en' })).toMatch(
      YEAR_FIRST_MONTH,
    );
  });

  it('renders an ongoing work as year + status word (not a month)', () => {
    const date = new Date(2026, 3, 15, 12);
    expect(formatEntryDate(date, { kind: 'work', lifecycle: 'ongoing', locale: 'en' })).toBe(
      '2026 · ongoing',
    );
  });

  it('formats in the es-AR locale (full date identical; short month year-first, no trailing dot)', () => {
    const note = new Date(2026, 4, 18);
    const work = new Date(2026, 3, 15, 12);
    expect(formatEntryDate(note, { kind: 'note', locale: 'es' })).toBe('2026 · 05 · 18');
    expect(formatEntryDate(work, { kind: 'work', lifecycle: 'shipping', locale: 'es' })).toMatch(
      YEAR_FIRST_MONTH,
    );
  });
});
