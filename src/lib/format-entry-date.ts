// Date display for the home "Latest entries" rows. Each kind keeps its
// own list-page date treatment so the feed reads like a digest of the
// real lists:
//   - note / piece → "2026 · 05 · 18" (full date), as `NoteEntry.astro`
//   - work         → "2026 · apr"   (year + short month), EXCEPT an
//                    ongoing work shows "2026 · ongoing" — its status,
//                    not a month. That collapse is specific to this
//                    compact row (the work card shows the lifecycle
//                    separately, as a status dot), so the logic lives
//                    here with a test rather than inline in the .astro.
//
// All kinds lead with the year on purpose, so the feed's date column
// aligns ("2026 · …" down the list). NOTE this differs from
// `WorkCard.astro`: that component feeds {year, month:'short'} straight
// to `Intl` and lowercases, which is locale-ordered — month-first for
// en-AU/es-AR ("apr · 2026"). Here the year is placed first explicitly
// so it can't drift by locale. The two surfaces differ on purpose until
// `TODO(date-order)` in WorkCard.astro is decided.
//
// Astro-free on purpose (same rationale as `latest-entries.ts`): no
// `astro:content` import, so it's unit-testable in plain vitest.
//
// FOLLOW-UP (flagged, not done here): `NoteEntry`/`PieceEntry`/`WorkCard`
// each inline an equivalent `Intl.DateTimeFormat`. They could adopt this
// helper to remove that duplication, but doing so re-opens three
// already-verified list surfaces for no functional gain — left for the
// writer to decide as a separate change.

type Locale = 'en' | 'es';

/** The kinds this formatter distinguishes. Declared locally rather than
 *  imported from `latest-entries` so a date util doesn't depend on the
 *  home-feed taxonomy — it's structurally compatible with `LatestKind`,
 *  so callers can pass that straight in. */
type EntryKind = 'note' | 'piece' | 'work';

const localeTag = (locale: Locale) => (locale === 'es' ? 'es-AR' : 'en-AU');

/** Full date, bullet-joined: "2026 · 05 · 18". Mirrors `NoteEntry.astro`. */
function fullDate(date: Date, locale: Locale): string {
  const parts = new Intl.DateTimeFormat(localeTag(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Australia/Melbourne',
  })
    .formatToParts(date)
    .filter((p) => p.type !== 'literal');
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${get('year')} · ${get('month')} · ${get('day')}`;
}

/** Year only: "2026". The shared leading element for the work forms. */
function year(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: 'numeric',
    timeZone: 'Australia/Melbourne',
  }).format(date);
}

/** Year + short month, year-first, lowercase: "2026 · apr" / "2026 · abr".
 *  Built as `year · month` explicitly so the order can't drift by locale
 *  (see header note re: `WorkCard.astro`). */
function shortMonth(date: Date, locale: Locale): string {
  const month = new Intl.DateTimeFormat(localeTag(locale), {
    month: 'short',
    timeZone: 'Australia/Melbourne',
  })
    .format(date)
    .toLowerCase()
    .replace(/\.$/, ''); // es-AR short months can carry a trailing dot ("abr.")
  return `${year(date, locale)} · ${month}`;
}

/** The date string for a latest-entries row. `lifecycle` only applies to
 *  works; an ongoing work renders "2026 · ongoing" (the raw lifecycle
 *  word, as `WorkCard` shows it — not localized) instead of a month. */
export function formatEntryDate(
  date: Date,
  { kind, lifecycle, locale }: { kind: EntryKind; lifecycle?: string | undefined; locale: Locale },
): string {
  if (kind === 'work') {
    return lifecycle === 'ongoing'
      ? `${year(date, locale)} · ${lifecycle}`
      : shortMonth(date, locale);
  }
  return fullDate(date, locale);
}
