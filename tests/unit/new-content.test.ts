import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { frontmatterOf } from '../../scripts/frontmatter.ts';
import {
  slugify,
  todayIso,
  validateDate,
  yamlString,
  yamlTagList,
  buildNoteMarkdown,
  buildPieceMarkdown,
  buildWorkMarkdown,
  replaceNowItem,
  loadPublishedWorkIds,
  makeScriptedContext,
  scaffoldNote,
  scaffoldPiece,
  scaffoldWork,
  scaffoldNowItem,
} from '../../scripts/new-content.ts';

// Pure helpers from `scripts/new-content.ts`. The CLI shell (readline
// prompts, fs writes) is intentionally not tested — the dispatch
// logic + frontmatter shape + now.md round-trip are what break the
// schema or the bilingual-pair contract when they go wrong.

describe('slugify', () => {
  it('lowercases ASCII titles', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips diacritics on Latin characters', () => {
    expect(slugify('café')).toBe('cafe');
    expect(slugify('señor')).toBe('senor');
    expect(slugify('árbol')).toBe('arbol');
  });

  it('collapses non-alphanumeric runs to a single hyphen', () => {
    expect(slugify('Hello — World')).toBe('hello-world');
    expect(slugify('a/b\\c, d!e?')).toBe('a-b-c-d-e');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  —Hello—  ')).toBe('hello');
  });

  it('passes the schema slug pattern ^[a-z0-9-]+$', () => {
    for (const input of ['Foo Bar', '¡Hola!', 'C4 — four times', 'naïve']) {
      const slug = slugify(input);
      expect(slug, `slug for ${JSON.stringify(input)}`).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('todayIso', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    expect(todayIso(new Date(2026, 4, 27))).toBe('2026-05-27');
  });

  it('pads single-digit month and day', () => {
    expect(todayIso(new Date(2026, 0, 3))).toBe('2026-01-03');
  });
});

describe('validateDate', () => {
  it('accepts a real, zero-padded YYYY-MM-DD (incl. a valid leap day)', () => {
    expect(validateDate('2026-05-27')).toBeNull();
    expect(validateDate('2024-02-29')).toBeNull(); // 2024 is a leap year
  });

  it('rejects the wrong shape (non-padded, words, slashes)', () => {
    expect(validateDate('2026-5-1')).toMatch(/YYYY-MM-DD/);
    expect(validateDate('tomorrow')).toMatch(/YYYY-MM-DD/);
    expect(validateDate('2026/05/27')).toMatch(/YYYY-MM-DD/);
  });

  it('rejects an impossible calendar date even when well-shaped', () => {
    expect(validateDate('2026-13-01')).toMatch(/real calendar date/);
    expect(validateDate('2026-02-30')).toMatch(/real calendar date/);
    expect(validateDate('2025-02-29')).toMatch(/real calendar date/); // 2025 not a leap year
  });
});

describe('yamlString', () => {
  it('wraps in single quotes', () => {
    expect(yamlString('hello')).toBe("'hello'");
  });

  it('doubles embedded apostrophes (YAML 1.2 single-quote escape)', () => {
    expect(yamlString("don't stop")).toBe("'don''t stop'");
  });

  it('handles strings with only an apostrophe', () => {
    expect(yamlString("'")).toBe("''''");
  });
});

describe('yamlTagList', () => {
  it('renders tags as inline list', () => {
    expect(yamlTagList(['foo', 'bar'])).toBe('[foo, bar]');
  });

  it('lowercases tags', () => {
    expect(yamlTagList(['Foo', 'BAR'])).toBe('[foo, bar]');
  });

  it('handles empty list', () => {
    expect(yamlTagList([])).toBe('[]');
  });
});

describe('buildNoteMarkdown', () => {
  it('emits required fields in frontmatter', () => {
    const md = buildNoteMarkdown({
      title: 'Hello',
      slug: 'hello',
      lang: 'en',
      translationId: 'hello-2026-05-27',
      date: '2026-05-27',
      tags: ['craft'],
    });
    expect(md).toContain("title: 'Hello'");
    expect(md).toContain("slug: 'hello'");
    expect(md).toContain('lang: en');
    expect(md).toContain('translationId: hello-2026-05-27');
    expect(md).toContain('date: 2026-05-27');
    expect(md).toContain('status: draft');
    expect(md).toContain('tags: [craft]');
  });

  it('omits optional fields when undefined', () => {
    const md = buildNoteMarkdown({
      title: 'Hello',
      slug: 'hello',
      lang: 'en',
      translationId: 'hello-2026-05-27',
      date: '2026-05-27',
      tags: ['craft'],
    });
    expect(md).not.toContain('kind:');
    expect(md).not.toContain('aside:');
    expect(md).not.toContain('lede:');
  });

  it('includes optional fields when present', () => {
    const md = buildNoteMarkdown({
      title: 'Hello',
      slug: 'hello',
      lang: 'en',
      translationId: 'hello-2026-05-27',
      date: '2026-05-27',
      tags: ['craft'],
      kind: 'code',
      aside: 'a side note',
      lede: 'a lede',
    });
    expect(md).toContain('kind: code');
    expect(md).toContain("aside: 'a side note'");
    expect(md).toContain("lede: 'a lede'");
  });

  it('ends with the _Draft._ placeholder body', () => {
    const md = buildNoteMarkdown({
      title: 'Hello',
      slug: 'hello',
      lang: 'en',
      translationId: 'hello-2026-05-27',
      date: '2026-05-27',
      tags: ['craft'],
    });
    expect(md).toContain('\n_Draft._\n');
  });
});

describe('buildPieceMarkdown', () => {
  it('emits piece-specific fields (written, marginNotes, diagrams)', () => {
    const md = buildPieceMarkdown({
      title: 'Rings',
      slug: 'rings',
      lang: 'en',
      translationId: 'rings-2026-05-27',
      date: '2026-05-27',
      tags: ['clean-architecture'],
      written: 'in Melbourne, in autumn',
    });
    expect(md).toContain("written: 'in Melbourne, in autumn'");
    expect(md).toContain('marginNotes: []');
    expect(md).toContain('diagrams: []');
  });

  it('always includes marginNotes and diagrams as empty arrays', () => {
    // The writer fills these in once H2s exist; the schema accepts
    // empty arrays as the default state.
    const md = buildPieceMarkdown({
      title: 'Rings',
      slug: 'rings',
      lang: 'en',
      translationId: 'rings-2026-05-27',
      date: '2026-05-27',
      tags: ['clean-architecture'],
    });
    expect(md).toContain('marginNotes: []');
    expect(md).toContain('diagrams: []');
  });
});

describe('buildWorkMarkdown', () => {
  it('requires kind (no schema default to lean on)', () => {
    const md = buildWorkMarkdown({
      title: 'This Site',
      slug: 'this-site',
      lang: 'en',
      translationId: 'this-site',
      date: '2026-05-21',
      tags: ['code'],
      kind: 'code',
    });
    expect(md).toContain('kind: code');
  });

  it('defaults lifecycle to shipping when unspecified', () => {
    const md = buildWorkMarkdown({
      title: 'This Site',
      slug: 'this-site',
      lang: 'en',
      translationId: 'this-site',
      date: '2026-05-21',
      tags: ['code'],
      kind: 'code',
    });
    expect(md).toContain('lifecycle: shipping');
  });

  it('honours explicit lifecycle', () => {
    const md = buildWorkMarkdown({
      title: 'This Site',
      slug: 'this-site',
      lang: 'en',
      translationId: 'this-site',
      date: '2026-05-21',
      tags: ['code'],
      kind: 'code',
      lifecycle: 'ongoing',
    });
    expect(md).toContain('lifecycle: ongoing');
  });

  it('omits number when not provided', () => {
    const md = buildWorkMarkdown({
      title: 'This Site',
      slug: 'this-site',
      lang: 'en',
      translationId: 'this-site',
      date: '2026-05-21',
      tags: ['code'],
      kind: 'code',
    });
    expect(md).not.toContain('number:');
  });

  it('emits the work-specific translationId convention (just the slug)', () => {
    // Per PR 1 schema refinement: works.translationId === slug.
    const md = buildWorkMarkdown({
      title: 'This Site',
      slug: 'this-site',
      lang: 'en',
      translationId: 'this-site',
      date: '2026-05-21',
      tags: ['code'],
      kind: 'code',
    });
    expect(md).toContain('translationId: this-site');
    // No date suffix on the translationId for works (unlike notes/pieces).
    expect(md).not.toContain('translationId: this-site-2026');
  });
});

describe('replaceNowItem', () => {
  // Minimal but valid now.md frontmatter for round-trip testing.
  const fixture = `---
title: 'Now'
slug: 'now'
lang: en
translationId: now
date: 2026-05-23
status: published
items:
  - kind: code
    where: 'on the bench · code'
    title: 'Item 1'
    prose: 'First item prose.'
    detail:
      - dt: 'd1'
        dd: 'v1'
      - dt: 'd2'
        dd: 'v2'
      - dt: 'd3'
        dd: 'v3'
  - kind: guitar
    where: 'in my hands · guitar'
    title: 'Item 2'
    prose: 'Second item prose.'
    detail:
      - dt: 'd1'
        dd: 'v1'
      - dt: 'd2'
        dd: 'v2'
      - dt: 'd3'
        dd: 'v3'
---

<!--
  The trailing HTML comment that documents the now.md contract.
  It must survive any round-trip through replaceNowItem.
-->
`;

  const newItem = {
    kind: 'garden' as const,
    where: 'in the huerta · garden',
    title: 'Replacement',
    prose: 'New prose.',
    detail: [
      { dt: 'a', dd: '1' },
      { dt: 'b', dd: '2' },
      { dt: 'c', dd: '3' },
    ],
  };

  it('replaces the targeted item only', () => {
    const out = replaceNowItem(fixture, 1, newItem);
    expect(out).toContain('Item 1'); // index 0 preserved
    expect(out).toContain('Replacement'); // index 1 replaced
    expect(out).not.toContain('Item 2'); // index 1 gone
  });

  it('preserves the trailing HTML comment after the frontmatter fence', () => {
    const out = replaceNowItem(fixture, 0, newItem);
    expect(out).toContain('<!--');
    expect(out).toContain('The trailing HTML comment');
    expect(out).toContain('-->');
  });

  it('preserves non-item frontmatter keys (title, slug, status, …)', () => {
    const out = replaceNowItem(fixture, 0, newItem);
    expect(out).toContain('translationId: now');
    expect(out).toContain('status: published');
    expect(out).toContain("title: 'Now'");
  });

  it('throws on out-of-range index', () => {
    expect(() => replaceNowItem(fixture, 99, newItem)).toThrow(/out of range/);
    expect(() => replaceNowItem(fixture, -1, newItem)).toThrow(/out of range/);
  });

  it('throws when the file has no frontmatter fence', () => {
    expect(() => replaceNowItem('plain markdown', 0, newItem)).toThrow(/YAML frontmatter fence/);
  });

  it('throws when the frontmatter has no items key', () => {
    const bad = `---\ntitle: 'X'\nslug: 'x'\n---\n`;
    expect(() => replaceNowItem(bad, 0, newItem)).toThrow(/items.*missing/);
  });

  it('omits the `work:` key when no work is linked', () => {
    const out = replaceNowItem(fixture, 0, newItem);
    // The fixture item had no work and newItem sets none — round-trips clean.
    expect(out).not.toContain('work:');
  });

  it('writes `work:` (between title and prose) when a work is linked', () => {
    const out = replaceNowItem(fixture, 0, { ...newItem, work: 'this-site' });
    expect(out).toContain('work: this-site');
    // Field order matches the shipped now.md: title → work → prose.
    const titleIdx = out.indexOf('title:');
    const workIdx = out.indexOf('work:');
    const proseIdx = out.indexOf('prose:');
    expect(titleIdx).toBeLessThan(workIdx);
    expect(workIdx).toBeLessThan(proseIdx);
  });

  it('round-trips a work translationId through the YAML document unchanged', () => {
    const out = replaceNowItem(fixture, 1, { ...newItem, work: 'gridfinity-bins' });
    const parsed = frontmatterOf(out) as unknown as {
      items: { work?: string }[];
    };
    expect(parsed.items[1]?.work).toBe('gridfinity-bins');
    // The untouched item 0 still carries no work key.
    expect(parsed.items[0]?.work).toBeUndefined();
  });

  it('omits the `teaser:` key when none is provided', () => {
    const out = replaceNowItem(fixture, 0, newItem);
    expect(out).not.toContain('teaser:');
  });

  it('writes a teaser block last (after detail) when provided', () => {
    const out = replaceNowItem(fixture, 0, {
      ...newItem,
      kind: 'code',
      teaser: { label: 'code', line: 'blurb' },
    });
    expect(out).toContain('teaser:');
    expect(out.indexOf('detail:')).toBeLessThan(out.indexOf('teaser:'));
    const parsed = frontmatterOf(out) as unknown as {
      items: { teaser?: { label: string; line: string } }[];
    };
    expect(parsed.items[0]?.teaser).toEqual({ label: 'code', line: 'blurb' });
  });

  it('includes the kind-conditional caption only when the teaser supplies it', () => {
    const out = replaceNowItem(fixture, 0, {
      ...newItem,
      kind: 'guitar',
      teaser: { label: 'guitar', line: 'l', guitarLabel: '· A m ·' },
    });
    expect(out).toContain('guitarLabel:');
    expect(out).not.toContain('seedlingTag:');
  });
});

describe('yamlString input hardening', () => {
  it('throws on inputs containing newlines', () => {
    expect(() => yamlString('a\nb')).toThrow(/control characters/);
  });

  it('throws on inputs containing tab or carriage return', () => {
    expect(() => yamlString('a\tb')).toThrow(/control characters/);
    expect(() => yamlString('a\rb')).toThrow(/control characters/);
  });

  it('throws on lesser-known control chars (BEL, NUL, DEL)', () => {
    // Locks the fix: an earlier version of the regex inadvertently
    // contained literal control bytes that only caught \n/\t/\r by
    // accident — these less-common cases would have slipped through.
    expect(() => yamlString('a\x00b')).toThrow(/control characters/);
    expect(() => yamlString('a\x07b')).toThrow(/control characters/);
    expect(() => yamlString('a\x7fb')).toThrow(/control characters/);
  });

  it('accepts ordinary printable strings (incl. high-Unicode)', () => {
    expect(() => yamlString('café · 12')).not.toThrow();
    expect(() => yamlString('a — b')).not.toThrow();
  });
});

// End-to-end coverage for the CLI dispatch — uses `makeScriptedContext`
// to drive each scaffold function with canned answers + a temp content
// root, then re-parses the written files to assert frontmatter shape
// + Zod-compatible content. Catches regressions in prompt sequence,
// validation order, and dispatch wiring that the pure-helper tests
// above can't see.

interface Fm {
  title: string;
  slug: string;
  lang: 'en' | 'es';
  translationId: string;
  status: string;
  tags?: string[];
  kind?: string;
  lifecycle?: string;
  written?: string;
}

function fmOf(text: string): Fm {
  const fm = frontmatterOf(text);
  if (!fm) throw new Error('no frontmatter fence');
  return fm as unknown as Fm;
}

describe('scaffoldNote (end-to-end via ScriptedContext)', () => {
  let tempRoot: string;

  it('writes both EN and ES files with a shared translationId', async () => {
    const ctx = makeScriptedContext(
      [
        'Hello',
        'Hola',
        '', // EN slug default (slugified title)
        '', // ES slug default
        '2099-01-01',
        'craft',
        'oficio',
        '', // optional EN lede
        '', // optional ES lede
        'code', // optional kind
      ],
      tempRoot,
    );
    const result = await scaffoldNote(ctx);

    expect(result.paths).toHaveLength(2);
    const en = fmOf(await readFile(result.paths[0]!, 'utf-8'));
    const es = fmOf(await readFile(result.paths[1]!, 'utf-8'));

    expect(en.slug).toBe('hello');
    expect(es.slug).toBe('hola');
    expect(en.translationId).toBe('hello-2099-01-01');
    expect(es.translationId).toBe('hello-2099-01-01');
    expect(en.lang).toBe('en');
    expect(es.lang).toBe('es');
    expect(en.status).toBe('draft');
    expect(en.kind).toBe('code');
  });

  it('refuses to overwrite an existing file', async () => {
    const answers = ['Hello', 'Hola', '', '', '2099-01-01', 'craft', 'oficio', '', '', ''];
    await scaffoldNote(makeScriptedContext(answers, tempRoot));
    await expect(scaffoldNote(makeScriptedContext(answers, tempRoot))).rejects.toThrow(
      /refusing to overwrite/,
    );
  });

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'scaffold-test-'));
  });
  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });
});

describe('scaffoldPiece (end-to-end)', () => {
  let tempRoot: string;

  it('writes both files with marginNotes/diagrams as empty arrays + written field', async () => {
    const ctx = makeScriptedContext(
      [
        'Rings',
        'Anillos',
        '',
        '',
        '2099-01-01',
        'clean-architecture',
        'arquitectura-limpia',
        '',
        '',
        'in Melbourne, in autumn',
        'en Melbourne, en otoño',
      ],
      tempRoot,
    );
    const result = await scaffoldPiece(ctx);

    const en = await readFile(result.paths[0]!, 'utf-8');
    expect(en).toContain('marginNotes: []');
    expect(en).toContain('diagrams: []');
    expect(en).toContain("written: 'in Melbourne, in autumn'");
  });

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'scaffold-test-'));
  });
  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });
});

describe('scaffoldWork (end-to-end)', () => {
  let tempRoot: string;

  it('emits flat filename (no date prefix) + slug-as-translationId', async () => {
    const ctx = makeScriptedContext(
      [
        'Smoke Work',
        'Obra de Humo',
        '',
        '',
        '2099-01-01',
        'craft',
        'oficio',
        'code',
        'shipping',
        '07',
        '',
        '',
      ],
      tempRoot,
    );
    const result = await scaffoldWork(ctx);

    expect(result.paths[0]).toMatch(/works\/en\/smoke-work\.md$/);
    expect(result.paths[1]).toMatch(/works\/es\/obra-de-humo\.md$/);

    const en = fmOf(await readFile(result.paths[0]!, 'utf-8'));
    expect(en.translationId).toBe('smoke-work');
    expect(en.kind).toBe('code');
    expect(en.lifecycle).toBe('shipping');
  });

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'scaffold-test-'));
  });
  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });
});

// Now-item flow needs an existing now.md pair (it replaces in place) plus
// works on disk (the `work` ref is validated against published works).
// Helpers write a minimal-but-parseable fixture tree into the temp root.
const NOW_FIXTURE = (lang: 'en' | 'es', t1: string, t2: string) => `---
title: 'Now'
slug: 'now'
lang: ${lang}
translationId: now
date: 2026-05-23
status: published
items:
  - kind: code
    where: 'on the bench · code'
    title: '${t1}'
    prose: 'First.'
    detail:
      - dt: 'a'
        dd: '1'
      - dt: 'b'
        dd: '2'
      - dt: 'c'
        dd: '3'
  - kind: guitar
    where: 'in my hands · guitar'
    title: '${t2}'
    prose: 'Second.'
    detail:
      - dt: 'a'
        dd: '1'
      - dt: 'b'
        dd: '2'
      - dt: 'c'
        dd: '3'
---

<!-- trailing comment that must survive the round-trip -->
`;

const WORK_FIXTURE = (lang: 'en' | 'es', slug: string) => `---
title: 'This site'
slug: '${slug}'
lang: ${lang}
translationId: this-site
date: 2026-05-21
status: published
tags: [code]
kind: code
lifecycle: ongoing
---

body
`;

async function seedNowFixtures(root: string): Promise<void> {
  await mkdir(join(root, 'pages', 'en'), { recursive: true });
  await mkdir(join(root, 'pages', 'es'), { recursive: true });
  await mkdir(join(root, 'works', 'en'), { recursive: true });
  await mkdir(join(root, 'works', 'es'), { recursive: true });
  await writeFile(join(root, 'pages', 'en', 'now.md'), NOW_FIXTURE('en', 'Item 1', 'Item 2'));
  await writeFile(join(root, 'pages', 'es', 'now.md'), NOW_FIXTURE('es', 'Ítem 1', 'Ítem 2'));
  await writeFile(join(root, 'works', 'en', 'this-site.md'), WORK_FIXTURE('en', 'this-site'));
  await writeFile(join(root, 'works', 'es', 'este-sitio.md'), WORK_FIXTURE('es', 'este-sitio'));
}

interface NowFm {
  items: {
    title: string;
    work?: string;
    teaser?: { label: string; line: string };
  }[];
}
const nowItemsOf = (text: string): NowFm => frontmatterOf(text) as unknown as NowFm;

describe('loadPublishedWorkIds', () => {
  let tempRoot: string;
  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'scaffold-test-'));
  });
  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it('collects published work translationIds from both locales', async () => {
    await seedNowFixtures(tempRoot);
    const ids = await loadPublishedWorkIds(tempRoot);
    expect(ids.has('this-site')).toBe(true);
  });

  it('returns an empty set when no works dir exists (does not throw)', async () => {
    const ids = await loadPublishedWorkIds(tempRoot); // nothing seeded
    expect(ids.size).toBe(0);
  });
});

describe('scaffoldNowItem (end-to-end)', () => {
  let tempRoot: string;
  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'scaffold-test-'));
    await seedNowFixtures(tempRoot);
  });
  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it('replaces the chosen item with a work link + teaser, in both locales', async () => {
    const ctx = makeScriptedContext(
      [
        '2', // replace index 2
        'code', // kind
        'on the bench · code', // EN where
        'sobre la mesa · código', // ES where
        'New EN Title', // EN title
        'Nuevo título ES', // ES title
        'EN prose.', // EN prose
        'Prosa ES.', // ES prose
        'this-site', // work (validated against the seeded works)
        'code', // teaser EN label (non-empty → teaser path)
        'código', // teaser ES label
        'EN line', // teaser EN line
        'línea ES', // teaser ES line
        // 3 detail rows: EN dt, EN dd, ES dt, ES dd
        'stack',
        'Astro',
        'stack',
        'Astro',
        'weight',
        '11 KB',
        'peso',
        '11 KB',
        'learned',
        'less JS',
        'aprendí',
        'menos JS',
      ],
      tempRoot,
    );
    const result = await scaffoldNowItem(ctx);

    const en = nowItemsOf(await readFile(result.paths[0]!, 'utf-8'));
    const es = nowItemsOf(await readFile(result.paths[1]!, 'utf-8'));

    // Index 1 (0-based) replaced; index 0 untouched.
    expect(en.items[0]?.title).toBe('Item 1');
    expect(en.items[1]?.title).toBe('New EN Title');
    expect(en.items[1]?.work).toBe('this-site');
    expect(en.items[1]?.teaser).toEqual({ label: 'code', line: 'EN line' });
    expect(es.items[1]?.title).toBe('Nuevo título ES');
    expect(es.items[1]?.work).toBe('this-site');
    expect(es.items[1]?.teaser).toEqual({ label: 'código', line: 'línea ES' });
  });

  it('rejects a `work` ref that is not a published work (fail at prompt)', async () => {
    const ctx = makeScriptedContext(
      [
        '1',
        'code',
        'on the bench · code',
        'sobre la mesa · código',
        'T',
        'T',
        'P',
        'P',
        'no-such-work', // unknown translationId → validation throws
      ],
      tempRoot,
    );
    await expect(scaffoldNowItem(ctx)).rejects.toThrow(/no published work/);
  });
});

describe('makeScriptedContext', () => {
  it('throws clearly when scripted answers run out', async () => {
    const ctx = makeScriptedContext(['Hello'], '/tmp');
    await ctx.ask({ question: 'first' });
    await expect(ctx.ask({ question: 'second' })).rejects.toThrow(/out of answers/);
  });

  it('throws on an invalid answer rather than retrying (fail-loud)', async () => {
    const ctx = makeScriptedContext(['not-a-valid-kind'], '/tmp');
    await expect(
      ctx.ask({
        question: 'kind',
        validate: (v) => (v === 'code' ? null : 'must be code'),
      }),
    ).rejects.toThrow(/invalid answer/);
  });
});
