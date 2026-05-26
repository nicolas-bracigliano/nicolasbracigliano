import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REGISTRY_KEYS } from '../../src/lib/diagram-registry';

// Drift detector for the PR P4 per-diagram colour palette. Each diagram
// component carries `.d-<role>` classes on its SVG groups; the matching
// `.diagram--<kind>` rule in `pieces.css` must:
//
//   1. Bind every `.d-<role>` referenced in the SVG to a `stroke:` or
//      `fill:` via `var(--c-<role>)`. If a future edit adds a new role
//      to the SVG but forgets the CSS binding, the role inherits
//      `currentColor` silently and reads with the wrong colour.
//
//   2. Declare each `--c-<role>` it uses to a real palette token. If
//      a binding references `var(--c-foo)` but no `--c-foo: ...` is
//      declared on the wrapper, the variable resolves to its
//      `, currentColor` fallback — the diagram silently flattens.
//
// The test reads the source files (not the built output) so it catches
// authoring drift before the build step. Pure-string scanning avoids
// pulling in an SVG / CSS parser dependency for ~50 lines of glue.

const REPO_ROOT = join(__dirname, '..', '..');
const DIAGRAMS_ROOT = join(REPO_ROOT, 'src', 'components', 'diagrams');
const DIAGRAMS_CSS = join(REPO_ROOT, 'src', 'styles', 'diagrams.css');

interface DiagramSource {
  /** Registry key (e.g. `clean-arch-rings`). */
  key: string;
  /** Filename stem (`CleanArchRings.astro` → `CleanArchRings`). */
  componentStem: string;
  /** `.diagram--<kind>` class on the wrapping `<figure>`. */
  wrapperClass: string;
}

// Hand-curated map. The registry key drives the URL; the wrapper class
// is what the SVG actually uses. Both ends live here so the test fails
// loudly if either side renames without the other.
const DIAGRAMS: readonly DiagramSource[] = [
  { key: 'clean-arch-rings', componentStem: 'CleanArchRings', wrapperClass: 'diagram--rings' },
  { key: 'c4-wheel', componentStem: 'C4Wheel', wrapperClass: 'diagram--c4-wheel' },
  { key: 'c4-context', componentStem: 'C4Level', wrapperClass: 'diagram--c4-level' },
  { key: 'cpr-framework', componentStem: 'CprFramework', wrapperClass: 'diagram--cpr' },
  { key: 'agile-road-knot', componentStem: 'AgileRoadKnot', wrapperClass: 'diagram--road-knot' },
] as const;

function readComponent(stem: string): string {
  return readFileSync(join(DIAGRAMS_ROOT, `${stem}.astro`), 'utf-8');
}

function extractRoleClasses(source: string): string[] {
  // Match `class="d-foo"` and `class="d-foo d-bar ..."` patterns.
  // Build a set so duplicates collapse.
  const found = new Set<string>();
  for (const match of source.matchAll(/class="([^"]+)"/g)) {
    for (const cls of match[1]!.split(/\s+/)) {
      if (cls.startsWith('d-')) found.add(cls);
    }
  }
  return Array.from(found).sort();
}

function readDiagramsCss(): string {
  return readFileSync(DIAGRAMS_CSS, 'utf-8');
}

function extractRoleBindings(css: string, wrapperClass: string): string[] {
  // Match selectors of the form `.diagram--rings .d-<role>` and return
  // the role classes that appear. Tolerant of multi-line rule blocks.
  const re = new RegExp(`\\.${wrapperClass.replace(/-/g, '\\-')}\\s+\\.(d-[\\w-]+)\\s*\\{`, 'g');
  const found = new Set<string>();
  for (const m of css.matchAll(re)) {
    found.add(m[1]!);
  }
  return Array.from(found).sort();
}

function extractDeclaredCustomProperties(css: string, wrapperClass: string): string[] {
  // Match the `.diagram--<kind>` block (no descendant selector) and
  // pull `--c-<name>:` declarations inside it.
  const blockRe = new RegExp(`\\.${wrapperClass.replace(/-/g, '\\-')}\\s*\\{([^}]*)\\}`, 'g');
  const found = new Set<string>();
  for (const m of css.matchAll(blockRe)) {
    const body = m[1] ?? '';
    for (const declMatch of body.matchAll(/(--c-[\w-]+)\s*:/g)) {
      found.add(declMatch[1]!);
    }
  }
  return Array.from(found).sort();
}

function extractReferencedCustomProperties(css: string, wrapperClass: string): string[] {
  // Match the binding rules `.diagram--<kind> .d-<role> { ... var(--c-name) ... }`
  // and pull each `var(--c-name)` reference.
  const re = new RegExp(
    `\\.${wrapperClass.replace(/-/g, '\\-')}\\s+\\.d-[\\w-]+\\s*\\{([^}]*)\\}`,
    'g',
  );
  const found = new Set<string>();
  for (const m of css.matchAll(re)) {
    const body = m[1] ?? '';
    for (const v of body.matchAll(/var\((--c-[\w-]+)/g)) {
      found.add(v[1]!);
    }
  }
  return Array.from(found).sort();
}

describe('diagram role palette drift detector (PR P4)', () => {
  // Forward: every `.d-<role>` in a diagram's SVG must have a matching
  // CSS binding rule.
  for (const diagram of DIAGRAMS) {
    it(`${diagram.componentStem}: every .d-<role> class has a CSS binding`, () => {
      const source = readComponent(diagram.componentStem);
      const svgRoles = extractRoleClasses(source);
      const cssBindings = extractRoleBindings(readDiagramsCss(), diagram.wrapperClass);
      for (const role of svgRoles) {
        expect(
          cssBindings,
          `${diagram.componentStem} SVG uses ${role} but .${diagram.wrapperClass} has no binding rule`,
        ).toContain(role);
      }
      // Sanity: each diagram declares at least one role (no diagram
      // should silently fall back to flat currentColor after this PR).
      expect(
        svgRoles.length,
        `${diagram.componentStem} should declare at least one .d-<role> class`,
      ).toBeGreaterThanOrEqual(1);
    });
  }

  // Orphan: every `.d-<role>` binding rule in CSS must have a matching
  // SVG class. A refactor that removes `class="d-foo"` from a diagram
  // but leaves `.diagram--<kind> .d-foo { ... }` in CSS would otherwise
  // pass the forward + reverse tests silently. Dead CSS rules don't
  // cause visible bugs but rot over time; this catches them at the
  // schema level.
  for (const diagram of DIAGRAMS) {
    it(`${diagram.componentStem}: every CSS binding has a matching SVG class`, () => {
      const svgRoles = extractRoleClasses(readComponent(diagram.componentStem));
      const cssBindings = extractRoleBindings(readDiagramsCss(), diagram.wrapperClass);
      for (const binding of cssBindings) {
        expect(
          svgRoles,
          `.${diagram.wrapperClass} binds .${binding} but the SVG has no element with that class`,
        ).toContain(binding);
      }
    });
  }

  // Reverse: every `--c-<name>` referenced inside a `.diagram--<kind>`
  // binding rule must be declared on the wrapper block. A typo like
  // `var(--c-arrwo)` would otherwise silently fall back to `currentColor`.
  for (const diagram of DIAGRAMS) {
    it(`${diagram.wrapperClass}: every var(--c-*) reference is declared`, () => {
      const css = readDiagramsCss();
      const declared = extractDeclaredCustomProperties(css, diagram.wrapperClass);
      const referenced = extractReferencedCustomProperties(css, diagram.wrapperClass);
      for (const ref of referenced) {
        expect(
          declared,
          `${diagram.wrapperClass} binds ${ref} but the wrapper block doesn't declare it`,
        ).toContain(ref);
      }
    });
  }

  // Hand-curated DIAGRAMS list stays in sync with the registry: every
  // diagram registered in `diagram-registry.ts` is exercised here.
  it('DIAGRAMS test list covers every registry key (sans c4-level duplicates)', () => {
    // c4-context/containers/components/code all resolve to the same
    // C4Level component → one test entry covers them all.
    const c4Levels = new Set(['c4-context', 'c4-containers', 'c4-components', 'c4-code']);
    const registryKeys = REGISTRY_KEYS.filter((k) => !c4Levels.has(k));
    const testKeys = DIAGRAMS.map((d) => d.key).filter((k) => k !== 'c4-context');
    // The test entry for `c4-context` represents the C4Level component;
    // strip it before comparing the non-C4-level set.
    expect(testKeys.sort()).toEqual(registryKeys.filter((k) => k !== 'c4-context').sort());
  });
});
