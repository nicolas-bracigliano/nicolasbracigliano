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
// + marginNotes/diagrams arrays, now-items = exact 6 slots with
// 3 detail rows). Doing this by hand reliably means re-reading
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

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { parseDocument, type Document } from 'yaml';
import { WORK_KINDS, NOTE_KINDS, NOW_KINDS } from '../src/lib/content-kinds.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const CONTENT_ROOT = join(REPO_ROOT, 'src', 'content');

export type Locale = 'en' | 'es';

// ---------- pure helpers ----------

/** kebab-case slug from arbitrary input. Lower-cases, transliterates
 *  common accented characters, replaces non-alphanumeric runs with a
 *  single `-`, and trims edges. Matches the schema's
 *  `^[a-z0-9-]+$` pattern; the unit tests pin the edge cases. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Today's date in YYYY-MM-DD, in the local timezone — matches how
 *  every existing entry frontmatter date is written. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Quote a string for single-quoted YAML output. Doubles embedded
 *  apostrophes per YAML 1.2 spec, returns the value wrapped in
 *  single quotes. Use this for any user-supplied string to match
 *  the repo's existing frontmatter style (single quotes throughout). */
export function yamlString(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

/** Render a tag list as a YAML inline array, matching the existing
 *  `tags: [foo, bar]` style. Tags are lowercased per the schema's
 *  transform. */
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

export interface NowItemInput {
  kind: (typeof NOW_KINDS)[number];
  where: string;
  title: string;
  prose: string;
  detail: readonly { dt: string; dd: string }[];
}

/** Parse a now.md file as a YAML document and replace one item in
 *  the `items:` array. Returns the new file contents preserving
 *  every other item AND the trailing HTML comment that lives after
 *  the `---` fence. `yaml`'s `parseDocument` + `Document.toString()`
 *  preserves quoting style + key order for the items we don't
 *  touch, so the diff reads as "one item changed."
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
    prose: newItem.prose,
    detail: newItem.detail.map((row) => ({ dt: row.dt, dd: row.dd })),
  });

  return `---\n${doc.toString().trimEnd()}\n---${trailing}`;
}

// ---------- CLI ----------

interface Prompt {
  question: string;
  default?: string;
  validate?: (value: string) => string | null; // return error message or null
}

interface CliContext {
  ask: (p: Prompt) => Promise<string>;
  askOptional: (p: Prompt) => Promise<string | undefined>;
}

async function makeContext(): Promise<CliContext & { close: () => void }> {
  const rl = createInterface({ input, output });

  async function ask(prompt: Prompt): Promise<string> {
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
      return value;
    }
  }

  async function askOptional(prompt: Prompt): Promise<string | undefined> {
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
    return value;
  }

  return { ask, askOptional, close: () => rl.close() };
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

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function writeNew(path: string, contents: string): Promise<void> {
  if (await fileExists(path)) {
    throw new Error(`refusing to overwrite existing file: ${path}`);
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf-8');
}

async function scaffoldNote(ctx: CliContext): Promise<void> {
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
  const date = await ctx.ask({ question: 'date (YYYY-MM-DD)', default: todayIso() });
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
  const kind = await ctx.askOptional({
    question: `kind (${NOTE_KINDS.join('|')})`,
    validate: validateInSet(NOTE_KINDS),
  });

  const translationId = `${enSlug}-${date}`;
  const filename = `${date}-${enSlug}.md`;
  const esFilename = `${date}-${esSlug}.md`;

  const enPath = join(CONTENT_ROOT, 'notes', 'en', filename);
  const esPath = join(CONTENT_ROOT, 'notes', 'es', esFilename);

  const enMd = buildNoteMarkdown({
    title: enTitle,
    slug: enSlug,
    lang: 'en',
    translationId,
    date,
    tags: parseTags(enTagsRaw),
    ...(enLede && { lede: enLede }),
    ...(kind && { kind: kind as NonNullable<NoteFrontmatterInput['kind']> }),
  });
  const esMd = buildNoteMarkdown({
    title: esTitle,
    slug: esSlug,
    lang: 'es',
    translationId,
    date,
    tags: parseTags(esTagsRaw),
    ...(esLede && { lede: esLede }),
    ...(kind && { kind: kind as NonNullable<NoteFrontmatterInput['kind']> }),
  });

  await writeNew(enPath, enMd);
  await writeNew(esPath, esMd);
  console.log(`\nCreated:\n  ${enPath}\n  ${esPath}\n`);
  console.log(`Both files are status: draft. Run \`pnpm verify:fast\` when you're ready.`);
}

async function scaffoldPiece(ctx: CliContext): Promise<void> {
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
  const date = await ctx.ask({ question: 'date (YYYY-MM-DD)', default: todayIso() });
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
  const enPath = join(CONTENT_ROOT, 'pieces', 'en', `${date}-${enSlug}.md`);
  const esPath = join(CONTENT_ROOT, 'pieces', 'es', `${date}-${esSlug}.md`);

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
}

async function scaffoldWork(ctx: CliContext): Promise<void> {
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
  const date = await ctx.ask({ question: 'date (YYYY-MM-DD)', default: todayIso() });
  const enTagsRaw = await ctx.ask({
    question: 'EN tags (comma-separated, 1–3)',
    validate: validateTags,
  });
  const esTagsRaw = await ctx.ask({
    question: 'ES tags (comma-separated, 1–3)',
    validate: validateTags,
  });
  const kind = await ctx.ask({
    question: `kind (${WORK_KINDS.join('|')})`,
    default: 'code',
    validate: validateInSet(WORK_KINDS),
  });
  const lifecycle = await ctx.ask({
    question: 'lifecycle (shipping|ongoing|draft|archived)',
    default: 'shipping',
    validate: validateInSet(['shipping', 'ongoing', 'draft', 'archived']),
  });
  const number = await ctx.askOptional({ question: 'catalog number (e.g. "07")' });
  const enLede = await ctx.askOptional({ question: 'EN lede' });
  const esLede = await ctx.askOptional({ question: 'ES lede' });

  // Works share the slug as translationId (no date suffix) — slug is
  // the long-lived identity, per the schema refinement landed in PR 1.
  const translationId = enSlug;
  const enPath = join(CONTENT_ROOT, 'works', 'en', `${enSlug}.md`);
  const esPath = join(CONTENT_ROOT, 'works', 'es', `${esSlug}.md`);

  await writeNew(
    enPath,
    buildWorkMarkdown({
      title: enTitle,
      slug: enSlug,
      lang: 'en',
      translationId,
      date,
      tags: parseTags(enTagsRaw),
      kind: kind as NonNullable<WorkFrontmatterInput['kind']>,
      lifecycle: lifecycle as NonNullable<WorkFrontmatterInput['lifecycle']>,
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
      kind: kind as NonNullable<WorkFrontmatterInput['kind']>,
      lifecycle: lifecycle as NonNullable<WorkFrontmatterInput['lifecycle']>,
      ...(number && { number }),
      ...(esLede && { lede: esLede }),
    }),
  );

  console.log(`\nCreated:\n  ${enPath}\n  ${esPath}\n`);
}

async function scaffoldNowItem(ctx: CliContext): Promise<void> {
  console.log('\n→ replace a now-page item\n');
  console.log(
    'The now schema locks the items array to exactly 6 entries; adding means replacing.\n',
  );

  const enPath = join(CONTENT_ROOT, 'pages', 'en', 'now.md');
  const esPath = join(CONTENT_ROOT, 'pages', 'es', 'now.md');
  const enContents = await readFile(enPath, 'utf-8');
  const esContents = await readFile(esPath, 'utf-8');

  // Show current items (title only, both locales side by side).
  const enDoc = parseDocument(enContents.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '');
  const esDoc = parseDocument(esContents.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '');
  const enItems = enDoc.get('items') as { items: { toJSON(): unknown }[] } | undefined;
  const esItems = esDoc.get('items') as { items: { toJSON(): unknown }[] } | undefined;
  if (!enItems || !esItems) {
    throw new Error('now.md `items:` array not found in one or both locales');
  }

  console.log('Current items:');
  for (let i = 0; i < 6; i++) {
    const en = (enItems.items[i]?.toJSON() as { title?: string })?.title ?? '?';
    const es = (esItems.items[i]?.toJSON() as { title?: string })?.title ?? '?';
    console.log(`  ${i + 1}. EN: ${en}`);
    console.log(`     ES: ${es}`);
  }
  console.log('');

  const idxRaw = await ctx.ask({
    question: 'Replace which index (1–6)?',
    validate: (v) => (/^[1-6]$/.test(v) ? null : 'enter a number 1–6'),
  });
  const index = parseInt(idxRaw, 10) - 1;

  const kind = await ctx.ask({
    question: `kind (${NOW_KINDS.join('|')})`,
    validate: validateInSet(NOW_KINDS),
  });
  const enWhere = await ctx.ask({ question: 'EN where (e.g. "on the bench · code")' });
  const esWhere = await ctx.ask({ question: 'ES where (e.g. "sobre la mesa · código")' });
  const enTitle = await ctx.ask({ question: 'EN title' });
  const esTitle = await ctx.ask({ question: 'ES title' });
  const enProse = await ctx.ask({ question: 'EN prose (one paragraph, single line)' });
  const esProse = await ctx.ask({ question: 'ES prose (one paragraph, single line)' });

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
    kind: kind as NowItemInput['kind'],
    where: enWhere,
    title: enTitle,
    prose: enProse,
    detail: detailRows.map((r) => r.en),
  });
  const newEs = replaceNowItem(esContents, index, {
    kind: kind as NowItemInput['kind'],
    where: esWhere,
    title: esTitle,
    prose: esProse,
    detail: detailRows.map((r) => r.es),
  });

  await writeFile(enPath, newEn, 'utf-8');
  await writeFile(esPath, newEs, 'utf-8');

  console.log(`\nReplaced item ${index + 1} in:\n  ${enPath}\n  ${esPath}\n`);
  console.log(`Heads up: src/content/pages/{en,es}/home.md \`bench\` mirrors the same`);
  console.log(`subjects in a shorter shape. The comment in now.md says "keep the two`);
  console.log(`in sync" — open that file and update the matching bench entry too.`);
}

async function main(): Promise<number> {
  const ctx = await makeContext();
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
