import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REGISTRY_KEYS, isDiagramKey } from '../../src/lib/diagram-registry';

// Drift detector for the declarative `diagrams: string[]` frontmatter
// → `DiagramRail` component registry. Two halves:
//
//   FORWARD (always enforced) — every diagram key referenced in any
//   piece's frontmatter must resolve to a real REGISTRY_KEYS entry.
//   Typos and renames fail the build instead of silently producing
//   a console warning at render time.
//
//   REVERSE (deferred until PR P3) — every REGISTRY_KEYS entry should
//   be referenced by SOME piece. P2 lands no content, so the reverse
//   half passes vacuously; P3 enables it once the four legacy posts
//   migrate. Until then, an unused diagram component would slip past.
//
// Lifting the reverse half is a one-line change in P3 (remove the
// `xfail`-style guard in the second `it`).

const PIECES_ROOT = join(__dirname, '..', '..', 'src', 'content', 'pieces');

function loadAllPieceFrontmatterKeys(): { file: string; keys: string[] }[] {
  const out: { file: string; keys: string[] }[] = [];
  for (const locale of ['en', 'es'] as const) {
    let entries: string[];
    try {
      entries = readdirSync(join(PIECES_ROOT, locale));
    } catch {
      // Locale directory may not exist yet (P2 ships before any piece
      // markdown lands). Skip silently — the FORWARD test passes on
      // empty input.
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith('.md')) continue;
      const path = join(PIECES_ROOT, locale, file);
      const text = readFileSync(path, 'utf-8');
      // Cheap frontmatter parser: find the `diagrams:` line and read
      // either inline `[a, b]` or block `- a\n- b\n` syntax. Avoid
      // pulling in a YAML dependency for one field.
      const inline = text.match(/^diagrams:\s*\[([^\]]*)\]/m);
      const block = text.match(/^diagrams:\s*\n((?:\s*-\s+[^\n]+\n?)+)/m);
      const keys: string[] = [];
      if (inline && inline[1]) {
        for (const raw of inline[1].split(',')) {
          const k = raw.trim().replace(/^['"]|['"]$/g, '');
          if (k) keys.push(k);
        }
      } else if (block && block[1]) {
        for (const line of block[1].split('\n')) {
          const m = line.match(/-\s+['"]?([^'"\s]+)['"]?/);
          if (m && m[1]) keys.push(m[1]);
        }
      }
      out.push({ file: `${locale}/${file}`, keys });
    }
  }
  return out;
}

describe('diagram registry ↔ pieces frontmatter', () => {
  const allPieceKeys = loadAllPieceFrontmatterKeys();

  it('forward: every `diagrams: [...]` value resolves to a REGISTRY_KEYS entry', () => {
    const offenders: string[] = [];
    for (const { file, keys } of allPieceKeys) {
      for (const k of keys) {
        if (!isDiagramKey(k)) {
          offenders.push(`${file}: "${k}"`);
        }
      }
    }
    expect(
      offenders,
      'Diagrams referenced in piece frontmatter must exist in REGISTRY_KEYS',
    ).toEqual([]);
  });

  it('reverse: every REGISTRY_KEYS entry is referenced by some piece [skipped until PR P3]', () => {
    // PR P3 will flip this guard to actually assert. P2 ships the
    // registry alongside zero content, so the reverse direction is
    // trivially false but not meaningfully so — it's not actionable
    // information until pieces exist. See the FORWARD test above for
    // the always-on half of the drift detector.
    const referenced = new Set<string>();
    for (const { keys } of allPieceKeys) {
      for (const k of keys) referenced.add(k);
    }
    const unused = REGISTRY_KEYS.filter((k) => !referenced.has(k));
    if (allPieceKeys.length === 0) {
      // P2 state — no content exists yet. Skip the reverse half.
      expect(unused.length).toBeGreaterThanOrEqual(0);
      return;
    }
    // P3+ state — pieces exist; every registry key should be cited.
    expect(unused, 'Registry keys not referenced by any piece').toEqual([]);
  });

  it('REGISTRY_KEYS itself is non-empty (sanity)', () => {
    expect(REGISTRY_KEYS.length).toBeGreaterThan(0);
  });

  it('isDiagramKey rejects unknown keys', () => {
    expect(isDiagramKey('clean-arch-rings')).toBe(true);
    expect(isDiagramKey('not-a-real-key')).toBe(false);
  });
});
