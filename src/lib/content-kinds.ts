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
