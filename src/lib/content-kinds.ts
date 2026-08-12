// Site-wide kind taxonomy. Each collection picks its allowed subset
// below. Pure TS so this file imports cleanly from the content schema,
// components, and tests alike.

export const CONTENT_KINDS = [
  'code',
  'guitar',
  'garden',
  'print',
  'coffee',
  'read',
  'home',
] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

/** Subset valid for `works` — deliverables, not activities (no coffee/read). */
export const WORK_KINDS = ['code', 'guitar', 'garden', 'print', 'home'] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

/** Stable work-state identifiers used in frontmatter and CSS hooks. */
export const WORK_LIFECYCLES = ['shipping', 'ongoing', 'draft', 'archived'] as const;
export type WorkLifecycle = (typeof WORK_LIFECYCLES)[number];

export type ContentLocale = 'en' | 'es';

// User-facing labels stay separate from the stable identifiers above:
// frontmatter, filters, and CSS continue to use the English ids while
// cards and detail pages render in the current locale.
const WORK_KIND_LABELS = {
  en: { code: 'code', guitar: 'music', garden: 'garden', print: '3D print', home: 'home' },
  es: { code: 'código', guitar: 'música', garden: 'huerta', print: 'impresión 3D', home: 'casa' },
} as const satisfies Record<ContentLocale, Record<WorkKind, string>>;

const WORK_LIFECYCLE_LABELS = {
  en: { shipping: 'shipping', ongoing: 'ongoing', draft: 'draft', archived: 'archived' },
  es: { shipping: 'publicado', ongoing: 'en proceso', draft: 'borrador', archived: 'archivado' },
} as const satisfies Record<ContentLocale, Record<WorkLifecycle, string>>;

export const workKindLabel = (kind: WorkKind, locale: ContentLocale): string =>
  WORK_KIND_LABELS[locale][kind];

export const workLifecycleLabel = (lifecycle: WorkLifecycle, locale: ContentLocale): string =>
  WORK_LIFECYCLE_LABELS[locale][lifecycle];

/** Subset valid for home-page `bench` items — matches WORK_KINDS by design. */
export const BENCH_KINDS = WORK_KINDS;
export type BenchKind = WorkKind;

/** Subset valid for now-page items — the full set. */
export const NOW_KINDS = CONTENT_KINDS;
export type NowKind = ContentKind;

/** Subset with a registered glyph in the art registry. Notes may omit
 *  `kind:` entirely (no glyph rendered). Expand alongside the registry. */
export const NOTE_KINDS = ['code', 'guitar', 'garden', 'coffee'] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];
