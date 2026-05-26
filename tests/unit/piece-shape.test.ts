import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

// ADR 0011: pieces follow the kernel-plus-6-sections shape. This test
// is a loose envelope, not a tight gate — the design-system §7a recipe
// targets 1200-1500 body words; this test passes anywhere in 800-1800
// to leave editorial range without flagging healthy outliers. Same
// thinking for H2 count: target is 6-7, envelope is 6-8.
//
// Why not tighter: a piece that genuinely earns 1700 words shouldn't
// fail a structural test that's supposed to catch accidental thinness
// or sprawl. The §7a recipe + ADR 0011 are the binding guidance; this
// test is the guardrail.
//
// Also enforces the tag pattern (ADR 0011 rule 6 / §7a step 8): 2-3
// tags per piece, framework-first. The count is testable; "framework-
// first ordering" is a review judgement, not enforced here.

const PIECES_ROOT = join(__dirname, '..', '..', 'src', 'content', 'pieces');

const MIN_H2 = 6;
const MAX_H2 = 8;
const MIN_WORDS = 800;
const MAX_WORDS = 1800;
const MIN_TAGS = 2;
const MAX_TAGS = 3;

function listPieces(): string[] {
  const out: string[] = [];
  for (const locale of ['en', 'es'] as const) {
    let entries: string[];
    try {
      entries = readdirSync(join(PIECES_ROOT, locale));
    } catch {
      continue;
    }
    for (const file of entries) {
      if (file.endsWith('.md')) out.push(join(PIECES_ROOT, locale, file));
    }
  }
  return out.sort();
}

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n/);
  return match ? raw.slice(match[0].length) : raw;
}

function parseTags(raw: string): string[] {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return [];
  const data = parseYaml(match[1]!) as { tags?: string[] };
  return Array.isArray(data?.tags) ? data.tags : [];
}

function stripCode(body: string): string {
  return body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

function countH2s(body: string): number {
  return body.split('\n').filter((line) => /^## /.test(line)).length;
}

function countBodyWords(body: string): number {
  // Drop H2/H3 headings to count prose only — leaving headings inflates
  // the count by ~30 words per piece and biases toward "looks fine."
  // The recipe targets BODY words; this matches.
  const proseOnly = body
    .split('\n')
    .filter((line) => !/^#{1,6} /.test(line))
    .join(' ')
    .replace(/[*_`~]+/g, ' ');
  return proseOnly.split(/\s+/).filter((w) => w.length > 0).length;
}

describe('piece shape — H2 count + body word count envelope (ADR 0011)', () => {
  const pieces = listPieces();
  it('finds at least one piece to scan', () => {
    expect(pieces.length).toBeGreaterThan(0);
  });

  for (const file of pieces) {
    const display = file.replace(PIECES_ROOT, '').replace(/^\//, '');

    it(`${display} — H2 count is ${MIN_H2}-${MAX_H2}`, () => {
      const raw = readFileSync(file, 'utf-8');
      const body = stripFrontmatter(raw);
      const h2 = countH2s(body);
      expect(
        h2,
        `${display} has ${h2} H2 sections. Recipe targets 6-7; envelope is ${MIN_H2}-${MAX_H2}. ` +
          `If outside this range, the piece probably wants a different shape (short note, multi-part series).`,
      ).toBeGreaterThanOrEqual(MIN_H2);
      expect(h2).toBeLessThanOrEqual(MAX_H2);
    });

    it(`${display} — body word count is ${MIN_WORDS}-${MAX_WORDS}`, () => {
      const raw = readFileSync(file, 'utf-8');
      const body = stripCode(stripFrontmatter(raw));
      const words = countBodyWords(body);
      expect(
        words,
        `${display} has ${words} body words. Recipe targets 1200-1500; envelope is ${MIN_WORDS}-${MAX_WORDS}. ` +
          `Below = too thin for the format; above = wrong format (push to a series).`,
      ).toBeGreaterThanOrEqual(MIN_WORDS);
      expect(words).toBeLessThanOrEqual(MAX_WORDS);
    });

    it(`${display} — tag count is ${MIN_TAGS}-${MAX_TAGS}`, () => {
      const raw = readFileSync(file, 'utf-8');
      const tags = parseTags(raw);
      expect(
        tags.length,
        `${display} has ${tags.length} tags (${tags.join(', ')}). Recipe (ADR 0011 rule 6 / §7a step 8): ` +
          `${MIN_TAGS}-${MAX_TAGS} tags, framework-first. Framework-first ordering is a review call; this only checks the count.`,
      ).toBeGreaterThanOrEqual(MIN_TAGS);
      expect(tags.length).toBeLessThanOrEqual(MAX_TAGS);
    });
  }
});
