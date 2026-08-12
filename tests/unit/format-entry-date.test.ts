// Unit tests for `formatEntryDate` (`src/lib/format-entry-date.ts`), the
// per-kind date string for home "Latest entries" rows. The interesting
// case is the work branch: an ongoing work shows its status word instead
// of a month — logic that can't be unit-tested while inlined in an
// `.astro`, which is why the helper exists.
//
// Dates use ISO strings (e.g. `new Date('2026-05-18')`) so fixtures
// match date-only frontmatter, which parses as UTC midnight. Without a
// pinned `timeZone`, formatting in a runner west of UTC would show the
// previous calendar day.

import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { formatEntryDate } from '../../src/lib/format-entry-date';

describe('formatEntryDate', () => {
  it('renders notes and pieces as a full bullet-joined date', () => {
    const date = new Date('2026-05-18');
    expect(formatEntryDate(date, { kind: 'note', locale: 'en' })).toBe('2026 · 05 · 18');
    expect(formatEntryDate(date, { kind: 'piece', locale: 'en' })).toBe('2026 · 05 · 18');
  });

  it('does not shift ISO date-only frontmatter in a timezone west of UTC', () => {
    const moduleUrl = new URL('../../src/lib/format-entry-date.ts', import.meta.url).href;
    const script = `
      const { formatEntryDate } = await import(${JSON.stringify(moduleUrl)});
      const date = new Date('2026-05-18');
      console.log(formatEntryDate(date, { kind: 'note', locale: 'en' }));
    `;
    const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf-8',
      env: { ...process.env, TZ: 'America/New_York' },
    }).trim();

    expect(output).toBe('2026 · 05 · 18');
  });

  // The exact short-month string ("apr"/"abr") is ICU-locale-data and
  // depends on the runner's Node/ICU build, so assert the *contract*
  // instead: year first, " · " separator, a lowercased month with no
  // trailing dot (es-AR's "abr." gets stripped). That still pins the two
  // things that actually matter here — year-first ordering (where this
  // diverges from WorkCard) and the lowercase/dot handling.
  const YEAR_FIRST_MONTH = /^2026 · \p{Ll}{3,}$/u;

  it('renders a non-ongoing work as year-first + lowercase short month', () => {
    const date = new Date('2026-04-15');
    expect(formatEntryDate(date, { kind: 'work', lifecycle: 'shipping', locale: 'en' })).toMatch(
      YEAR_FIRST_MONTH,
    );
  });

  it('renders an ongoing work as year + status word (not a month)', () => {
    const date = new Date('2026-04-15');
    expect(formatEntryDate(date, { kind: 'work', lifecycle: 'ongoing', locale: 'en' })).toBe(
      '2026 · ongoing',
    );
  });

  it('formats in the es-AR locale (full date identical; short month year-first, no trailing dot)', () => {
    const note = new Date('2026-05-18');
    const work = new Date('2026-04-15');
    expect(formatEntryDate(note, { kind: 'note', locale: 'es' })).toBe('2026 · 05 · 18');
    expect(formatEntryDate(work, { kind: 'work', lifecycle: 'shipping', locale: 'es' })).toMatch(
      YEAR_FIRST_MONTH,
    );
    expect(formatEntryDate(work, { kind: 'work', lifecycle: 'ongoing', locale: 'es' })).toBe(
      '2026 · en proceso',
    );
  });
});
