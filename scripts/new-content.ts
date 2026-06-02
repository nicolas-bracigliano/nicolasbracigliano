#!/usr/bin/env node
// `pnpm new` — interactive scaffold for the four bilingual content
// shapes on this site: notes, pieces (ensayos), works (obras), and
// now-page items. Writes the minimal frontmatter + a placeholder
// body so the entry passes Zod and renders in `pnpm dev` from the
// first save; the writer fills in the real content.
//
// Why a script: every entry is a bilingual pair sharing one
// `translationId`, and each collection has its own frontmatter
// quirks (works = no date prefix on filename, pieces = `written:`
// + marginNotes/diagrams arrays, now-items = a bounded list with
// 3 detail rows each + an optional `work:` cross-link to a /works
// entry). Doing this by hand reliably means re-reading
// the schemas and the design system every time. The script
// removes that reload cost.
//
// Pure helpers (slugify, frontmatter builders, now-item splice)
// are exported for `tests/unit/new-content.test.ts`. The CLI
// shell at the bottom is guarded behind `import.meta.url`
// equality so importing the module doesn't trigger prompts.
//
// New entries are written FLAT (`<slug>.md`), matching every
// existing entry. The `hero: ./art.svg` per-entry override (ADR
// 0013) requires a directory-shaped layout; converting flat → dir
// is a one-step manual move when a writer wants bespoke art.

import { mkdir, open, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { parseDocument, type Document } from 'yaml';
import { frontmatterOf } from './frontmatter.ts';
import { WORK_KINDS, NOTE_KINDS, NOW_KINDS, BENCH_KINDS } from '../src/lib/content-kinds.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const CONTENT_ROOT = join(REPO_ROOT, 'src', 'content');

export type Locale = 'en' | 'es';

// ---------- pure helpers ----------

/** kebab-case slug matching the schema's `^[a-z0-9-]+$` pattern. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Today's date in YYYY-MM-DD, local timezone. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Quote a string for single-quoted YAML. Throws on control chars
 *  (single-quoted YAML has no escape sequence for them). */
export function yamlString(s: string): string {
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(s)) {
    throw new Error(
      `yamlString: input contains control characters (cannot represent in single-quoted YAML): ${JSON.stringify(s)}`,
    );
  }
  return `'${s.replace(/'/g, "''")}'`;
}

/** Render tags as `[foo, bar]` (matches the repo's inline-flow style). */
export function yamlTagList(tags: readonly string[]): string {
  return `[${tags.map((t) => t.toLowerCase()).join(', ')}]`;
}

export interface BaseFrontmatterInput {
  title: string;
  slug: string;
  lang: Locale;
  translationId: string;
  date: string;
  tags: readonly string[];
  lede?: string;
}

export interface NoteFrontmatterInput extends BaseFrontmatterInput {
  kind?: (typeof NOTE_KINDS)[number];
  aside?: string;
}

export interface PieceFrontmatterInput extends BaseFrontmatterInput {
  written?: string;
}

export interface WorkFrontmatterInput extends BaseFrontmatterInput {
  kind: (typeof WORK_KINDS)[number];
  lifecycle?: 'shipping' | 'ongoing' | 'draft' | 'archived';
  number?: string;
}

/** Assemble a note's frontmatter block + placeholder body. Returns
 *  the full markdown file contents (including the `---` fences). */
export function buildNoteMarkdown(input: NoteFrontmatterInput): string {
  const lines: string[] = ['---'];
  lines.push(`title: ${yamlString(input.title)}`);
  lines.push(`slug: ${yamlString(input.slug)}`);
  lines.push(`lang: ${input.lang}`);
  lines.push(`translationId: ${input.translationId}`);
  lines.push(`date: ${input.date}`);
  lines.push(`status: draft`);
  if (input.tags.length > 0) lines.push(`tags: ${yamlTagList(input.tags)}`);
  if (input.kind) lines.push(`kind: ${input.kind}`);
  if (input.aside) lines.push(`aside: ${yamlString(input.aside)}`);
  if (input.lede) lines.push(`lede: ${yamlString(input.lede)}`);
  lines.push('---');
  lines.push('');
  lines.push('_Draft._');
  lines.push('');
  return lines.join('\n');
}

/** Piece markdown — same shape as notes plus `written:` and empty
 *  `marginNotes`/`diagrams` arrays (the writer fills them in once
 *  the H2 sections exist; §7a is a thinking process, not a fill-
 *  in-the-blanks template). */
export function buildPieceMarkdown(input: PieceFrontmatterInput): string {
  const lines: string[] = ['---'];
  lines.push(`title: ${yamlString(input.title)}`);
  lines.push(`slug: ${yamlString(input.slug)}`);
  lines.push(`lang: ${input.lang}`);
  lines.push(`translationId: ${input.translationId}`);
  lines.push(`date: ${input.date}`);
  if (input.written) lines.push(`written: ${yamlString(input.written)}`);
  lines.push(`status: draft`);
  if (input.tags.length > 0) lines.push(`tags: ${yamlTagList(input.tags)}`);
  if (input.lede) lines.push(`lede: ${yamlString(input.lede)}`);
  lines.push('marginNotes: []');
  lines.push('diagrams: []');
  lines.push('---');
  lines.push('');
  lines.push('_Draft._');
  lines.push('');
  return lines.join('\n');
}

/** Work markdown — different shape: no date prefix on filename
 *  (handled by the CLI shell), `kind` is required (no schema
 *  default to lean on for a scaffolded entry where the writer
 *  should think about it), `lifecycle: shipping` matches the
 *  schema default. */
export function buildWorkMarkdown(input: WorkFrontmatterInput): string {
  const lines: string[] = ['---'];
  lines.push(`title: ${yamlString(input.title)}`);
  lines.push(`slug: ${yamlString(input.slug)}`);
  lines.push(`lang: ${input.lang}`);
  lines.push(`translationId: ${input.translationId}`);
  lines.push(`date: ${input.date}`);
  lines.push(`status: draft`);
  if (input.tags.length > 0) lines.push(`tags: ${yamlTagList(input.tags)}`);
  lines.push(`kind: ${input.kind}`);
  lines.push(`lifecycle: ${input.lifecycle ?? 'shipping'}`);
  if (input.number) lines.push(`number: ${yamlString(input.number)}`);
  if (input.lede) lines.push(`lede: ${yamlString(input.lede)}`);
  lines.push('---');
  lines.push('');
  lines.push('_Draft._');
  lines.push('');
  return lines.join('\n');
}

/** A now item's optional home-bench teaser (ADR 0014). Localized —
 *  unlike `work`, each field differs per locale (EN "code" / ES "código").
 *  `guitarLabel`/`seedlingTag` are the vignette captions that the schema
 *  requires for guitar/garden kinds respectively. */
export interface NowTeaserInput {
  label: string;
  line: string;
  guitarLabel?: string;
  seedlingTag?: string;
}

export interface NowItemInput {
  kind: (typeof NOW_KINDS)[number];
  where: string;
  title: string;
  prose: string;
  detail: readonly { dt: string; dd: string }[];
  /** Optional cross-link to a `works` entry, by the work's
   *  `translationId` (locale-independent — the same value goes in both
   *  the EN and ES now.md). The /now pages resolve it to the localized
   *  `/works/<slug>` route. Omitted from the written YAML when absent. */
  work?: string;
  /** Optional teaser block — present only on bench-kind items that also
   *  surface on the home "on the bench" grid. Omitted from the written
   *  YAML when absent. */
  teaser?: NowTeaserInput;
}

/** Parse a now.md file as a YAML document and replace one item in
 *  the `items:` array. Returns the new file contents preserving
 *  every other item AND the trailing HTML comment that lives after
 *  the `---` fence. `yaml`'s `parseDocument` + `Document.toString()`
 *  preserves quoting style + key order for the items we don't
 *  touch, so the diff reads as "one item changed."
 *
 *  Writes the item fields from `newItem` in shipped-now.md order
 *  (kind/where/title/[work]/prose/detail/[teaser]). `work` and `teaser`
 *  are written only when present on the input — and conversely are NOT
 *  preserved from the existing item when absent. So replacing a teaser'd
 *  item without supplying a fresh teaser drops it from the home bench
 *  (ADR 0014); the CLI collects a teaser up front and warns on this.
 *
 *  Index is 0-based. Throws if the file isn't shaped like a now.md
 *  (missing `items:` array, wrong length, etc.) so a misuse fails
 *  loudly rather than silently corrupting the file. */
export function replaceNowItem(fileContents: string, index: number, newItem: NowItemInput): string {
  const fenceMatch = fileContents.match(/^---\n([\s\S]*?)\n---(\n[\s\S]*)?$/);
  if (!fenceMatch || !fenceMatch[1]) {
    throw new Error('replaceNowItem: file does not start with a YAML frontmatter fence');
  }
  const fm = fenceMatch[1];
  const trailing = fenceMatch[2] ?? '';

  const doc: Document = parseDocument(fm);
  const items = doc.get('items');
  // `items` is a YAMLSeq (a collection node — Document.get returns
  // collection nodes unwrapped only for scalars). Its array is at
  // `.items`; mutation goes through `.set(index, value)`, which
  // preserves the surrounding key order, indentation, and comments.
  const seq = items as { items: unknown[]; set: (i: number, v: unknown) => void } | undefined;
  if (!seq || !Array.isArray(seq.items) || typeof seq.set !== 'function') {
    throw new Error('replaceNowItem: `items:` key missing or not a sequence');
  }
  if (index < 0 || index >= seq.items.length) {
    throw new Error(`replaceNowItem: index ${index} out of range (0..${seq.items.length - 1})`);
  }
  seq.set(index, {
    kind: newItem.kind,
    where: newItem.where,
    title: newItem.title,
    // `work:` sits between title and prose to match the field order in
    // the shipped now.md items; the key is omitted entirely when no work
    // is linked, so an item without a cross-link round-trips unchanged.
    ...(newItem.work ? { work: newItem.work } : {}),
    prose: newItem.prose,
    detail: newItem.detail.map((row) => ({ dt: row.dt, dd: row.dd })),
    // `teaser:` is last, matching now.md; its sub-keys are spread
    // conditionally so guitarLabel/seedlingTag only appear for the kinds
    // that need them (the schema's kind-conditional refines).
    ...(newItem.teaser
      ? {
          teaser: {
            label: newItem.teaser.label,
            line: newItem.teaser.line,
            ...(newItem.teaser.guitarLabel ? { guitarLabel: newItem.teaser.guitarLabel } : {}),
            ...(newItem.teaser.seedlingTag ? { seedlingTag: newItem.teaser.seedlingTag } : {}),
          },
        }
      : {}),
  });

  return `---\n${doc.toString().trimEnd()}\n---${trailing}`;
}

// ---------- CLI ----------

export interface Prompt<T = string> {
  question: string;
  default?: string;
  validate?: (value: string) => string | null; // return error message or null
  /** Convert the validated string into the call site's wanted type.
   *  When omitted, ask returns the raw string. With a parser, the
   *  return type narrows — drops the `as NonNullable<…>` casts that
   *  call sites would otherwise need to coerce enum values. */
  parse?: (value: string) => T;
}

export interface CliContext {
  ask<T = string>(p: Prompt<T>): Promise<T>;
  askOptional<T = string>(p: Prompt<T>): Promise<T | undefined>;
  /** Root for scaffolded entries. Defaults to `src/content`; tests
   *  override to write to a temp directory. */
  contentRoot: string;
}

export async function makeReadlineContext(
  contentRoot: string = CONTENT_ROOT,
): Promise<CliContext & { close: () => void }> {
  const rl = createInterface({ input, output });

  async function ask<T = string>(prompt: Prompt<T>): Promise<T> {
    while (true) {
      const hint = prompt.default ? ` [${prompt.default}]` : '';
      const raw = (await rl.question(`${prompt.question}${hint}: `)).trim();
      const value = raw === '' && prompt.default !== undefined ? prompt.default : raw;
      if (value === '') {
        console.log('  (required — try again)');
        continue;
      }
      if (prompt.validate) {
        const err = prompt.validate(value);
        if (err) {
          console.log(`  ${err}`);
          continue;
        }
      }
      return prompt.parse ? prompt.parse(value) : (value as unknown as T);
    }
  }

  async function askOptional<T = string>(prompt: Prompt<T>): Promise<T | undefined> {
    const hint = prompt.default ? ` [${prompt.default}]` : ' (optional)';
    const raw = (await rl.question(`${prompt.question}${hint}: `)).trim();
    const value = raw === '' && prompt.default !== undefined ? prompt.default : raw;
    if (value === '') return undefined;
    if (prompt.validate) {
      const err = prompt.validate(value);
      if (err) {
        console.log(`  ${err}`);
        return askOptional(prompt);
      }
    }
    return prompt.parse ? prompt.parse(value) : (value as unknown as T);
  }

  return { ask, askOptional, contentRoot, close: () => rl.close() };
}

/** Test-only context that answers prompts from a canned list. Throws
 *  if the script asks more questions than the test provided answers
 *  for — a fail-loud signal that the prompt sequence changed. Empty
 *  strings in the answers array trigger default handling (same path
 *  the user hitting Enter takes). */
export function makeScriptedContext(answers: readonly string[], contentRoot: string): CliContext {
  let i = 0;
  function nextAnswer(): string {
    if (i >= answers.length) {
      throw new Error(`scripted context: out of answers (consumed ${i})`);
    }
    return answers[i++] ?? '';
  }

  async function ask<T = string>(prompt: Prompt<T>): Promise<T> {
    while (true) {
      const raw = nextAnswer().trim();
      const value = raw === '' && prompt.default !== undefined ? prompt.default : raw;
      if (value === '') {
        // Empty + no default would loop forever on readline; here we throw
        // so a missing canned answer is loud, not a hang.
        throw new Error(`scripted context: empty answer for required prompt "${prompt.question}"`);
      }
      if (prompt.validate) {
        const err = prompt.validate(value);
        if (err) {
          throw new Error(
            `scripted context: invalid answer "${value}" for "${prompt.question}" — ${err}`,
          );
        }
      }
      return prompt.parse ? prompt.parse(value) : (value as unknown as T);
    }
  }

  async function askOptional<T = string>(prompt: Prompt<T>): Promise<T | undefined> {
    const raw = nextAnswer().trim();
    const value = raw === '' && prompt.default !== undefined ? prompt.default : raw;
    if (value === '') return undefined;
    if (prompt.validate) {
      const err = prompt.validate(value);
      if (err) {
        throw new Error(
          `scripted context: invalid answer "${value}" for "${prompt.question}" — ${err}`,
        );
      }
    }
    return prompt.parse ? prompt.parse(value) : (value as unknown as T);
  }

  return { ask, askOptional, contentRoot };
}

const SLUG_RE = /^[a-z0-9-]+$/;
const validateSlug = (v: string): string | null =>
  SLUG_RE.test(v) ? null : 'slug must match ^[a-z0-9-]+$ (kebab-case)';

const validateInSet =
  (allowed: readonly string[]) =>
  (v: string): string | null =>
    allowed.includes(v) ? null : `must be one of: ${allowed.join(', ')}`;

const validateTags = (v: string): string | null => {
  const parts = v
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'enter at least one tag (comma-separated)';
  if (parts.length > 3) return 'max 3 tags';
  return null;
};

const parseTags = (v: string): string[] =>
  v
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

/** Validate a `YYYY-MM-DD` date string: zero-padded shape AND a real
 *  calendar date (rejects 2026-13-01, 2026-02-30). Catches a typo at the
 *  prompt rather than letting it through to the `translationId` refinement
 *  (`<slug>-\d{4}-\d{2}-\d{2}`) or `z.coerce.date()` at build time.
 *  Exported for direct unit coverage. */
export function validateDate(v: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return 'date must be YYYY-MM-DD (zero-padded)';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return 'not a real calendar date';
  }
  return null;
}

/** Collect the `translationId`s of every PUBLISHED work under
 *  `<contentRoot>/works/{en,es}`. Used to validate a now item's `work`
 *  cross-link at prompt time — a ref that isn't a published work would
 *  pass Zod but throw when the /now page resolves it. Returns an empty set
 *  if no works dir exists (e.g. a test temp root), in which case the
 *  caller skips the membership check rather than blocking. Exported for
 *  the scaffold's tests. */
export async function loadPublishedWorkIds(contentRoot: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const locale of ['en', 'es'] as const) {
    let files: string[];
    try {
      files = await readdir(join(contentRoot, 'works', locale));
    } catch {
      continue; // no works dir for this locale — skip, don't block
    }
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const text = await readFile(join(contentRoot, 'works', locale, file), 'utf-8');
      const fm = frontmatterOf(text);
      if (!fm) continue;
      if (fm.status === 'published' && typeof fm.translationId === 'string') {
        ids.add(fm.translationId);
      }
    }
  }
  return ids;
}

async function writeNew(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  // `wx` = write + exclusive create. Single atomic syscall that fails
  // with EEXIST if the file already exists — eliminates the check-
  // then-act race the previous `fileExists()` + `writeFile()` pair
  // had under concurrent invocation.
  let handle;
  try {
    handle = await open(path, 'wx');
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'EEXIST') {
      throw new Error(`refusing to overwrite existing file: ${path}`, { cause: err });
    }
    throw err;
  }
  try {
    await handle.writeFile(contents, 'utf-8');
  } finally {
    await handle.close();
  }
}

export async function scaffoldNote(ctx: CliContext): Promise<{ paths: string[] }> {
  console.log('\n→ new note (bilingual pair)\n');

  const enTitle = await ctx.ask({ question: 'EN title' });
  const esTitle = await ctx.ask({ question: 'ES title' });
  const enSlug = await ctx.ask({
    question: 'EN slug',
    default: slugify(enTitle),
    validate: validateSlug,
  });
  const esSlug = await ctx.ask({
    question: 'ES slug',
    default: slugify(esTitle),
    validate: validateSlug,
  });
  const date = await ctx.ask({
    question: 'date (YYYY-MM-DD)',
    default: todayIso(),
    validate: validateDate,
  });
  const enTagsRaw = await ctx.ask({
    question: 'EN tags (comma-separated, 1–3)',
    validate: validateTags,
  });
  const esTagsRaw = await ctx.ask({
    question: 'ES tags (comma-separated, 1–3)',
    validate: validateTags,
  });
  const enLede = await ctx.askOptional({ question: 'EN lede' });
  const esLede = await ctx.askOptional({ question: 'ES lede' });
  const kind = await ctx.askOptional<(typeof NOTE_KINDS)[number]>({
    question: `kind (${NOTE_KINDS.join('|')})`,
    validate: validateInSet(NOTE_KINDS),
    parse: (s) => s as (typeof NOTE_KINDS)[number],
  });

  const translationId = `${enSlug}-${date}`;
  const enPath = join(ctx.contentRoot, 'notes', 'en', `${date}-${enSlug}.md`);
  const esPath = join(ctx.contentRoot, 'notes', 'es', `${date}-${esSlug}.md`);

  const enMd = buildNoteMarkdown({
    title: enTitle,
    slug: enSlug,
    lang: 'en',
    translationId,
    date,
    tags: parseTags(enTagsRaw),
    ...(enLede && { lede: enLede }),
    ...(kind && { kind }),
  });
  const esMd = buildNoteMarkdown({
    title: esTitle,
    slug: esSlug,
    lang: 'es',
    translationId,
    date,
    tags: parseTags(esTagsRaw),
    ...(esLede && { lede: esLede }),
    ...(kind && { kind }),
  });

  await writeNew(enPath, enMd);
  await writeNew(esPath, esMd);
  console.log(`\nCreated:\n  ${enPath}\n  ${esPath}\n`);
  console.log(`Both files are status: draft. Run \`pnpm verify:fast\` when you're ready.`);
  return { paths: [enPath, esPath] };
}

export async function scaffoldPiece(ctx: CliContext): Promise<{ paths: string[] }> {
  console.log('\n→ new piece / ensayo (bilingual pair)\n');

  const enTitle = await ctx.ask({ question: 'EN title' });
  const esTitle = await ctx.ask({ question: 'ES title' });
  const enSlug = await ctx.ask({
    question: 'EN slug',
    default: slugify(enTitle),
    validate: validateSlug,
  });
  const esSlug = await ctx.ask({
    question: 'ES slug',
    default: slugify(esTitle),
    validate: validateSlug,
  });
  const date = await ctx.ask({
    question: 'date (YYYY-MM-DD)',
    default: todayIso(),
    validate: validateDate,
  });
  const enTagsRaw = await ctx.ask({
    question: 'EN tags (comma-separated, 1–3; framework-first per §7a)',
    validate: validateTags,
  });
  const esTagsRaw = await ctx.ask({
    question: 'ES tags (comma-separated, 1–3)',
    validate: validateTags,
  });
  const enLede = await ctx.askOptional({ question: 'EN lede' });
  const esLede = await ctx.askOptional({ question: 'ES lede' });
  const enWritten = await ctx.askOptional({
    question: 'EN written (e.g. "in Melbourne, in autumn")',
  });
  const esWritten = await ctx.askOptional({
    question: 'ES written (e.g. "en Melbourne, en otoño")',
  });

  const translationId = `${enSlug}-${date}`;
  const enPath = join(ctx.contentRoot, 'pieces', 'en', `${date}-${enSlug}.md`);
  const esPath = join(ctx.contentRoot, 'pieces', 'es', `${date}-${esSlug}.md`);

  await writeNew(
    enPath,
    buildPieceMarkdown({
      title: enTitle,
      slug: enSlug,
      lang: 'en',
      translationId,
      date,
      tags: parseTags(enTagsRaw),
      ...(enLede && { lede: enLede }),
      ...(enWritten && { written: enWritten }),
    }),
  );
  await writeNew(
    esPath,
    buildPieceMarkdown({
      title: esTitle,
      slug: esSlug,
      lang: 'es',
      translationId,
      date,
      tags: parseTags(esTagsRaw),
      ...(esLede && { lede: esLede }),
      ...(esWritten && { written: esWritten }),
    }),
  );

  console.log(`\nCreated:\n  ${enPath}\n  ${esPath}\n`);
  console.log(
    `Read docs/design-system.md §7a before drafting — pieces have a shape (kernel + 6–7 H2s).`,
  );
  return { paths: [enPath, esPath] };
}

export async function scaffoldWork(ctx: CliContext): Promise<{ paths: string[] }> {
  console.log('\n→ new work / obra (bilingual pair)\n');

  const enTitle = await ctx.ask({ question: 'EN title' });
  const esTitle = await ctx.ask({ question: 'ES title' });
  const enSlug = await ctx.ask({
    question: 'EN slug',
    default: slugify(enTitle),
    validate: validateSlug,
  });
  const esSlug = await ctx.ask({
    question: 'ES slug',
    default: slugify(esTitle),
    validate: validateSlug,
  });
  const date = await ctx.ask({
    question: 'date (YYYY-MM-DD)',
    default: todayIso(),
    validate: validateDate,
  });
  const enTagsRaw = await ctx.ask({
    question: 'EN tags (comma-separated, 1–3)',
    validate: validateTags,
  });
  const esTagsRaw = await ctx.ask({
    question: 'ES tags (comma-separated, 1–3)',
    validate: validateTags,
  });
  const kind = await ctx.ask<(typeof WORK_KINDS)[number]>({
    question: `kind (${WORK_KINDS.join('|')})`,
    default: 'code',
    validate: validateInSet(WORK_KINDS),
    parse: (s) => s as (typeof WORK_KINDS)[number],
  });
  const lifecycle = await ctx.ask<NonNullable<WorkFrontmatterInput['lifecycle']>>({
    question: 'lifecycle (shipping|ongoing|draft|archived)',
    default: 'shipping',
    validate: validateInSet(['shipping', 'ongoing', 'draft', 'archived']),
    parse: (s) => s as NonNullable<WorkFrontmatterInput['lifecycle']>,
  });
  const number = await ctx.askOptional({ question: 'catalog number (e.g. "07")' });
  const enLede = await ctx.askOptional({ question: 'EN lede' });
  const esLede = await ctx.askOptional({ question: 'ES lede' });

  // Works share the slug as translationId (no date suffix) — slug is
  // the long-lived identity (see the SLUG_TRANSLATION_ID refinement
  // in content.config.ts).
  const translationId = enSlug;
  const enPath = join(ctx.contentRoot, 'works', 'en', `${enSlug}.md`);
  const esPath = join(ctx.contentRoot, 'works', 'es', `${esSlug}.md`);

  await writeNew(
    enPath,
    buildWorkMarkdown({
      title: enTitle,
      slug: enSlug,
      lang: 'en',
      translationId,
      date,
      tags: parseTags(enTagsRaw),
      kind,
      lifecycle,
      ...(number && { number }),
      ...(enLede && { lede: enLede }),
    }),
  );
  await writeNew(
    esPath,
    buildWorkMarkdown({
      title: esTitle,
      slug: esSlug,
      lang: 'es',
      translationId,
      date,
      tags: parseTags(esTagsRaw),
      kind,
      lifecycle,
      ...(number && { number }),
      ...(esLede && { lede: esLede }),
    }),
  );

  console.log(`\nCreated:\n  ${enPath}\n  ${esPath}\n`);
  return { paths: [enPath, esPath] };
}

export async function scaffoldNowItem(ctx: CliContext): Promise<{ paths: string[] }> {
  console.log('\n→ replace a now-page item\n');
  console.log(
    'now.md holds a bounded list of bench items (see NOW_ITEM_MIN/MAX in\n' +
      'src/lib/now-items.ts); this flow replaces one existing item in place.\n',
  );

  const enPath = join(ctx.contentRoot, 'pages', 'en', 'now.md');
  const esPath = join(ctx.contentRoot, 'pages', 'es', 'now.md');
  const enContents = await readFile(enPath, 'utf-8');
  const esContents = await readFile(esPath, 'utf-8');

  // Published works, for validating the `work` cross-link at prompt time.
  const knownWorks = await loadPublishedWorkIds(ctx.contentRoot);

  // Show current items (title only, both locales side by side). Read-only
  // here, so plain frontmatter parse — `replaceNowItem` keeps the
  // format-preserving `parseDocument` path for the actual write.
  const enItems = frontmatterOf(enContents)?.items;
  const esItems = frontmatterOf(esContents)?.items;
  if (!Array.isArray(enItems) || !Array.isArray(esItems)) {
    throw new Error('now.md `items:` array not found in one or both locales');
  }
  const enList = enItems as Array<{ title?: string; teaser?: NowTeaserInput }>;
  const esList = esItems as Array<{ title?: string; teaser?: NowTeaserInput }>;
  // Derive the count from the file rather than hardcoding it: the array
  // is a NOW_ITEM_MIN..MAX range (commented-out items shrink it below the
  // old fixed six), and EN/ES must stay paired index-for-index.
  const itemCount = enList.length;
  if (esList.length !== itemCount) {
    throw new Error(
      `now.md item count mismatch — en has ${itemCount}, es has ${esList.length}; ` +
        'fix the pairing before replacing an item',
    );
  }

  console.log('Current items:');
  for (let i = 0; i < itemCount; i++) {
    console.log(`  ${i + 1}. EN: ${enList[i]?.title ?? '?'}`);
    console.log(`     ES: ${esList[i]?.title ?? '?'}`);
  }
  console.log('');

  const idxRaw = await ctx.ask({
    question: `Replace which index (1–${itemCount})?`,
    // Plain-decimal only, so validate and the parseInt below agree (Number
    // accepts "0x2"/"1e0" that parseInt(_, 10) would read differently).
    validate: (v) => {
      if (!/^\d+$/.test(v)) return `enter a number 1–${itemCount}`;
      const n = parseInt(v, 10);
      return n >= 1 && n <= itemCount ? null : `enter a number 1–${itemCount}`;
    },
  });
  const index = parseInt(idxRaw, 10) - 1;

  const kind = await ctx.ask<(typeof NOW_KINDS)[number]>({
    question: `kind (${NOW_KINDS.join('|')})`,
    validate: validateInSet(NOW_KINDS),
    parse: (s) => s as (typeof NOW_KINDS)[number],
  });
  const enWhere = await ctx.ask({ question: 'EN where (e.g. "on the bench · code")' });
  const esWhere = await ctx.ask({ question: 'ES where (e.g. "sobre la mesa · código")' });
  const enTitle = await ctx.ask({ question: 'EN title' });
  const esTitle = await ctx.ask({ question: 'ES title' });
  const enProse = await ctx.ask({ question: 'EN prose (one paragraph, single line)' });
  const esProse = await ctx.ask({ question: 'ES prose (one paragraph, single line)' });
  // One value for both locales — `work` is a work's translationId, which
  // is locale-independent (the EN/ES works share it). The /now pages
  // resolve it to the localized /works route. Optional: skip for items
  // (guitar, coffee, …) that aren't catalogued as a work. Validated
  // against the published works on disk (when any are present) so a typo'd
  // ref is caught here, not at the /now build that resolves it.
  const work = await ctx.askOptional({
    question: 'related work (a /works translationId, e.g. "this-site")',
    validate: (v) => {
      if (!SLUG_RE.test(v)) return 'must be a work translationId (kebab-case, ^[a-z0-9-]+$)';
      if (knownWorks.size > 0 && !knownWorks.has(v)) {
        return `no published work "${v}" — known: ${[...knownWorks].sort().join(', ')}`;
      }
      return null;
    },
  });

  // Optional home-bench teaser (ADR 0014) — offered only for bench kinds
  // (the home grid has no coffee/read vignette). Leaving the EN label
  // blank skips the teaser entirely; the kind-conditional guitarLabel /
  // seedlingTag prompts mirror the schema refines. Fields are localized,
  // so EN + ES are collected separately.
  let enTeaser: NowTeaserInput | undefined;
  let esTeaser: NowTeaserInput | undefined;
  if ((BENCH_KINDS as readonly string[]).includes(kind)) {
    const enLabel = await ctx.askOptional({
      question: 'teaser EN label (home bench eyebrow; blank = no teaser)',
    });
    if (enLabel) {
      const esLabel = await ctx.ask({ question: 'teaser ES label' });
      const enLine = await ctx.ask({ question: 'teaser EN line (short bench blurb)' });
      const esLine = await ctx.ask({ question: 'teaser ES line' });
      const enGuitar =
        kind === 'guitar' ? await ctx.ask({ question: 'teaser EN guitarLabel' }) : undefined;
      const esGuitar =
        kind === 'guitar' ? await ctx.ask({ question: 'teaser ES guitarLabel' }) : undefined;
      const enSeed =
        kind === 'garden' ? await ctx.ask({ question: 'teaser EN seedlingTag' }) : undefined;
      const esSeed =
        kind === 'garden' ? await ctx.ask({ question: 'teaser ES seedlingTag' }) : undefined;
      enTeaser = {
        label: enLabel,
        line: enLine,
        ...(enGuitar && { guitarLabel: enGuitar }),
        ...(enSeed && { seedlingTag: enSeed }),
      };
      esTeaser = {
        label: esLabel,
        line: esLine,
        ...(esGuitar && { guitarLabel: esGuitar }),
        ...(esSeed && { seedlingTag: esSeed }),
      };
    }
  }

  console.log('\nDetail rows (3 required, dt/dd):');
  const detailRows: { en: { dt: string; dd: string }; es: { dt: string; dd: string } }[] = [];
  for (let i = 1; i <= 3; i++) {
    const enDt = await ctx.ask({ question: `EN dt #${i}` });
    const enDd = await ctx.ask({ question: `EN dd #${i}` });
    const esDt = await ctx.ask({ question: `ES dt #${i}` });
    const esDd = await ctx.ask({ question: `ES dd #${i}` });
    detailRows.push({ en: { dt: enDt, dd: enDd }, es: { dt: esDt, dd: esDd } });
  }

  const newEn = replaceNowItem(enContents, index, {
    kind,
    where: enWhere,
    title: enTitle,
    prose: enProse,
    detail: detailRows.map((r) => r.en),
    ...(work && { work }),
    ...(enTeaser && { teaser: enTeaser }),
  });
  const newEs = replaceNowItem(esContents, index, {
    kind,
    where: esWhere,
    title: esTitle,
    prose: esProse,
    detail: detailRows.map((r) => r.es),
    ...(work && { work }),
    ...(esTeaser && { teaser: esTeaser }),
  });

  await writeFile(enPath, newEn, 'utf-8');
  await writeFile(esPath, newEs, 'utf-8');

  console.log(`\nReplaced item ${index + 1} in:\n  ${enPath}\n  ${esPath}\n`);
  if (work) console.log(`Linked to work \`${work}\` (resolves to the localized /works route).`);
  if (enTeaser) {
    console.log(`Teaser set — this item will show on the home "on the bench" grid (ADR 0014).`);
  } else if ((BENCH_KINDS as readonly string[]).includes(kind)) {
    console.log(
      `No teaser entered — this bench-kind item will NOT appear on the home bench.\n` +
        `If the item you replaced had a \`teaser:\`, that's now gone; re-add it in now.md.`,
    );
  }
  return { paths: [enPath, esPath] };
}

async function main(): Promise<number> {
  const ctx = await makeReadlineContext();
  try {
    console.log('What are you creating?\n');
    console.log('  1) note');
    console.log('  2) piece (ensayo)');
    console.log('  3) work (obra)');
    console.log('  4) now item (ahora)\n');

    const choice = await ctx.ask({
      question: 'Pick 1–4',
      validate: (v) => (/^[1-4]$/.test(v) ? null : 'enter a number 1–4'),
    });

    switch (choice) {
      case '1':
        await scaffoldNote(ctx);
        break;
      case '2':
        await scaffoldPiece(ctx);
        break;
      case '3':
        await scaffoldWork(ctx);
        break;
      case '4':
        await scaffoldNowItem(ctx);
        break;
    }
    return 0;
  } catch (err) {
    console.error(`\nError: ${(err as Error).message}`);
    return 1;
  } finally {
    ctx.close();
  }
}

// Run as CLI only when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const code = await main();
  process.exit(code);
}
