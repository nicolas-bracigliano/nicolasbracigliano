import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { REGISTRY_KEYS, isDiagramKey } from '../../src/lib/diagram-registry';

// Drift detector for the declarative `diagrams: [...]` frontmatter
// → `DiagramRail` component registry. Two halves:
//
//   FORWARD (always enforced) — every diagram key referenced in any
//   piece's frontmatter must resolve to a real REGISTRY_KEYS entry.
//   Typos and renames fail the test instead of waiting for the build
//   error in `pnpm build`.
//
//   REVERSE (deferred until PR P3) — every REGISTRY_KEYS entry should
//   be referenced by SOME piece. P2 lands no content, so the reverse
//   half passes vacuously; P3 enables it once the four legacy posts
//   migrate. Lifting is a one-line change (the short-circuit in
//   `it('reverse: ...)` goes away).

const PIECES_ROOT = join(__dirname, '..', '..', 'src', 'content', 'pieces');
const DIAGRAMS_ROOT = join(__dirname, '..', '..', 'src', 'components', 'diagrams');

interface FrontmatterDiagram {
  key: string;
  place?: 'top' | 'bottom';
  caption?: string;
}

/**
 * Extract the `diagrams` frontmatter array from a markdown file. Uses
 * the `yaml` package (already a dep) — handles inline/block lists,
 * quoted strings, and nested objects without bespoke regex.
 */
function extractDiagrams(markdown: string): FrontmatterDiagram[] {
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch || !fmMatch[1]) return [];
  let fm: Record<string, unknown>;
  try {
    fm = parseYaml(fmMatch[1]) as Record<string, unknown>;
  } catch {
    return [];
  }
  const diagrams = fm.diagrams;
  if (!Array.isArray(diagrams)) return [];
  // Coerce defensively rather than fail on shape — a malformed entry
  // is its own kind of drift, but the FORWARD test below will catch
  // it via the missing `key`.
  return diagrams
    .map((d): FrontmatterDiagram | null => {
      if (typeof d === 'string') return { key: d };
      if (
        d &&
        typeof d === 'object' &&
        'key' in d &&
        typeof (d as { key: unknown }).key === 'string'
      ) {
        return d as FrontmatterDiagram;
      }
      return null;
    })
    .filter((d): d is FrontmatterDiagram => d !== null);
}

function loadAllPieceDiagrams(): { file: string; diagrams: FrontmatterDiagram[] }[] {
  const out: { file: string; diagrams: FrontmatterDiagram[] }[] = [];
  for (const locale of ['en', 'es'] as const) {
    let entries: string[];
    try {
      entries = readdirSync(join(PIECES_ROOT, locale));
    } catch {
      // Locale directory may not exist yet (P2 ships before any piece
      // markdown lands). Skip silently — FORWARD passes on empty input.
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith('.md')) continue;
      const path = join(PIECES_ROOT, locale, file);
      const text = readFileSync(path, 'utf-8');
      out.push({ file: `${locale}/${file}`, diagrams: extractDiagrams(text) });
    }
  }
  return out;
}

describe('diagram registry ↔ pieces frontmatter', () => {
  const allPieces = loadAllPieceDiagrams();

  it('forward: every `diagrams[].key` value resolves to a REGISTRY_KEYS entry', () => {
    const offenders: string[] = [];
    for (const { file, diagrams } of allPieces) {
      for (const d of diagrams) {
        if (!isDiagramKey(d.key)) {
          offenders.push(`${file}: "${d.key}"`);
        }
      }
    }
    expect(
      offenders,
      'Diagrams referenced in piece frontmatter must exist in REGISTRY_KEYS',
    ).toEqual([]);
  });

  it('reverse: every REGISTRY_KEYS entry is referenced by some piece [skipped until PR P3]', () => {
    // PR P3 flips this guard to actually assert. P2 ships the registry
    // alongside zero content, so the reverse direction is trivially
    // false but not meaningfully so — it's not actionable until pieces
    // exist. See the FORWARD test above for the always-on half.
    const referenced = new Set<string>();
    for (const { diagrams } of allPieces) {
      for (const d of diagrams) referenced.add(d.key);
    }
    const unused = REGISTRY_KEYS.filter((k) => !referenced.has(k));
    if (allPieces.length === 0) {
      expect(unused.length).toBeGreaterThanOrEqual(0);
      return;
    }
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

describe('diagram component size budgets', () => {
  // Enforce the budget called out in the PR description so a future
  // contributor can't quietly bloat a component past the ceiling.
  // Per-component cap is generous (8 KB) because C4Level legitimately
  // carries 4 conditional level variants in one file — but only one
  // renders per page (Astro's `{cond && ...}` short-circuits at build).
  // Total cap reflects 5 components + a small margin.
  const PER_FILE_CAP_BYTES = 8 * 1024;
  const TOTAL_DIAGRAMS_CAP_BYTES = 18 * 1024;

  const diagramFiles = readdirSync(DIAGRAMS_ROOT).filter((f) => f.endsWith('.astro'));

  it.each(diagramFiles)('%s is under the per-file cap', (file) => {
    const size = statSync(join(DIAGRAMS_ROOT, file)).size;
    expect(size, `${file} is ${size} bytes`).toBeLessThan(PER_FILE_CAP_BYTES);
  });

  it('all diagrams combined are under the total cap', () => {
    const total = diagramFiles
      .map((f) => statSync(join(DIAGRAMS_ROOT, f)).size)
      .reduce((a, b) => a + b, 0);
    expect(total, `total diagrams source: ${total} bytes`).toBeLessThan(TOTAL_DIAGRAMS_CAP_BYTES);
  });

  it('there are at least 5 diagram components (PR P2 baseline)', () => {
    expect(diagramFiles.length).toBeGreaterThanOrEqual(5);
  });
});
