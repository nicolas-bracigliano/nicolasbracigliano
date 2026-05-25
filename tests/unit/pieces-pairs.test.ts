import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

// Pieces are bilingual by design — every published EN piece should have
// a published ES sibling and vice versa. The site's design philosophy
// (§2 of `docs/design-system.md`, ADR 0003) treats half-translated
// content as a stylistic anti-pattern; this test enforces the rule at
// build time so an orphan piece can't slip past code review.
//
// Pairing is by `translationKey`, not filename. `findSiblingIn` in
// `src/lib/i18n.ts` uses the same key to render the chrome's language
// toggle — orphans would show a disabled toggle, which works but
// shouldn't be the default for the pieces collection.

const PIECES_ROOT = join(__dirname, '..', '..', 'src', 'content', 'pieces');

interface PieceFrontmatter {
  translationKey: string;
  lang: 'en' | 'es';
  status: 'draft' | 'published' | 'retired';
  slug: string;
}

function loadPieces(): { file: string; data: PieceFrontmatter }[] {
  const out: { file: string; data: PieceFrontmatter }[] = [];
  for (const locale of ['en', 'es'] as const) {
    let entries: string[];
    try {
      entries = readdirSync(join(PIECES_ROOT, locale));
    } catch {
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith('.md')) continue;
      const text = readFileSync(join(PIECES_ROOT, locale, file), 'utf-8');
      const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch || !fmMatch[1]) continue;
      const data = parseYaml(fmMatch[1]) as PieceFrontmatter;
      out.push({ file: `${locale}/${file}`, data });
    }
  }
  return out;
}

describe('pieces ↔ siblings', () => {
  const pieces = loadPieces();

  it('every published piece has a published sibling in the other locale', () => {
    const published = pieces.filter((p) => p.data.status === 'published');
    const orphans: string[] = [];
    for (const p of published) {
      const other = p.data.lang === 'en' ? 'es' : 'en';
      const sibling = published.find(
        (s) => s.data.translationKey === p.data.translationKey && s.data.lang === other,
      );
      if (!sibling) {
        orphans.push(
          `${p.file} (translationKey: ${p.data.translationKey}) has no ${other} sibling`,
        );
      }
    }
    expect(orphans, 'Every published piece needs a published sibling').toEqual([]);
  });

  it('translationKeys are unique within a locale', () => {
    for (const locale of ['en', 'es'] as const) {
      const inLocale = pieces.filter((p) => p.data.lang === locale);
      const keys = inLocale.map((p) => p.data.translationKey);
      const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
      expect(duplicates, `Duplicate translationKey in ${locale}`).toEqual([]);
    }
  });

  it('slugs are unique within a locale', () => {
    for (const locale of ['en', 'es'] as const) {
      const inLocale = pieces.filter((p) => p.data.lang === locale);
      const slugs = inLocale.map((p) => p.data.slug);
      const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
      expect(duplicates, `Duplicate slug in ${locale}`).toEqual([]);
    }
  });
});
