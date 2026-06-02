import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatterOf } from '../../scripts/frontmatter.ts';

// Notes, pieces, and works are bilingual by design — every published EN
// entry should have a published ES sibling and vice versa. The site's
// design philosophy (§2 of `docs/design-system.md`, ADR 0003) treats
// half-translated content as a stylistic anti-pattern; this test enforces
// the rule at build time so an orphan can't slip past code review.
//
// Pairing is by `translationId`, not filename. `findSiblingIn` in
// `src/lib/i18n.ts` uses the same id to render the chrome's language
// toggle — orphans would show a disabled toggle, which works but
// shouldn't be the default for any of these collections.
//
// Pages are intentionally excluded: they're a fixed slug set and the
// `page-slugs.test.ts` drift test already enforces parity per locale.

const CONTENT_ROOT = join(__dirname, '..', '..', 'src', 'content');
const COLLECTIONS = ['notes', 'pieces', 'works'] as const;
type Collection = (typeof COLLECTIONS)[number];

interface EntryFrontmatter {
  translationId: string;
  lang: 'en' | 'es';
  status: 'draft' | 'published' | 'retired';
  slug: string;
}

function loadCollection(collection: Collection): { file: string; data: EntryFrontmatter }[] {
  const out: { file: string; data: EntryFrontmatter }[] = [];
  for (const locale of ['en', 'es'] as const) {
    let entries: string[];
    try {
      entries = readdirSync(join(CONTENT_ROOT, collection, locale));
    } catch {
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith('.md')) continue;
      const text = readFileSync(join(CONTENT_ROOT, collection, locale, file), 'utf-8');
      // Fail loud, don't skip: this test exists to catch content mistakes,
      // and a fence that doesn't parse IS one — skipping it would silently
      // exempt the broken file from the orphan check.
      const data = frontmatterOf<EntryFrontmatter>(text);
      if (!data) {
        throw new Error(`malformed or missing frontmatter fence: ${collection}/${locale}/${file}`);
      }
      out.push({ file: `${collection}/${locale}/${file}`, data });
    }
  }
  return out;
}

describe.each(COLLECTIONS)('%s ↔ siblings', (collection) => {
  const entries = loadCollection(collection);

  it('every published entry has a published sibling in the other locale', () => {
    const published = entries.filter((p) => p.data.status === 'published');
    const orphans: string[] = [];
    for (const p of published) {
      const other = p.data.lang === 'en' ? 'es' : 'en';
      const sibling = published.find(
        (s) => s.data.translationId === p.data.translationId && s.data.lang === other,
      );
      if (!sibling) {
        orphans.push(`${p.file} (translationId: ${p.data.translationId}) has no ${other} sibling`);
      }
    }
    expect(orphans, `Every published ${collection} entry needs a published sibling`).toEqual([]);
  });

  it('translationIds are unique within a locale', () => {
    for (const locale of ['en', 'es'] as const) {
      const inLocale = entries.filter((p) => p.data.lang === locale);
      const ids = inLocale.map((p) => p.data.translationId);
      const duplicates = ids.filter((k, i) => ids.indexOf(k) !== i);
      expect(duplicates, `Duplicate translationId in ${collection}/${locale}`).toEqual([]);
    }
  });

  it('slugs are unique within a locale', () => {
    for (const locale of ['en', 'es'] as const) {
      const inLocale = entries.filter((p) => p.data.lang === locale);
      const slugs = inLocale.map((p) => p.data.slug);
      const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
      expect(duplicates, `Duplicate slug in ${collection}/${locale}`).toEqual([]);
    }
  });
});
