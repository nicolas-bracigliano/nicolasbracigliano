import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  slugify,
  todayIso,
  yamlString,
  yamlTagList,
  buildNoteMarkdown,
  buildPieceMarkdown,
  buildWorkMarkdown,
  replaceNowItem,
  makeScriptedContext,
  scaffoldNote,
  scaffoldPiece,
  scaffoldWork,
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
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m || !m[1]) throw new Error('no frontmatter fence');
  return parseYaml(m[1]) as Fm;
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
