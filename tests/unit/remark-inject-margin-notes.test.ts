import { describe, expect, it } from 'vitest';
import remarkInjectMarginNotes from '../../src/lib/remark-inject-margin-notes';

// Unit tests for the remark plugin that powers pull-quote injection +
// `.lead-p` class injection on pieces. The plugin is a pure function on
// an mdast tree; these tests construct synthetic trees and assert the
// expected mutations.
//
// The plugin's contract (per ADR 0012):
//   1. Mark the first top-level paragraph with `class="lead-p"` for the
//      drop-cap CSS rule to target. Always runs, regardless of whether
//      margin notes are present.
//   2. For each `marginNotes[i]` in frontmatter, locate the H2 whose
//      slug matches `section`, then insert an `<aside class="pull">`
//      raw-HTML node AFTER the last sibling before the next H2 (or end
//      of document if the section is the last one).

// Mdast helpers — minimal shape matching what the plugin consumes.
interface Node {
  type: string;
  depth?: number;
  value?: string;
  children?: Node[];
  data?: { hProperties?: { className?: string } };
}

function heading(depth: number, text: string): Node {
  return { type: 'heading', depth, children: [{ type: 'text', value: text }] };
}
function paragraph(text: string): Node {
  return { type: 'paragraph', children: [{ type: 'text', value: text }] };
}
function root(...children: Node[]): Node {
  return { type: 'root', children };
}

interface VFile {
  data?: { astro?: { frontmatter?: { marginNotes?: Array<{ section: string; text: string }> } } };
}
function vfile(marginNotes: Array<{ section: string; text: string }> = []): VFile {
  return { data: { astro: { frontmatter: { marginNotes } } } };
}

function runPlugin(tree: Node, file: VFile): void {
  const plugin = remarkInjectMarginNotes();
  plugin(tree, file as unknown as Parameters<typeof plugin>[1]);
}

describe('lead-p injection', () => {
  it('marks the first paragraph with class="lead-p"', () => {
    const tree = root(
      paragraph('Opening paragraph.'),
      heading(2, 'First section'),
      paragraph('Body.'),
    );
    runPlugin(tree, vfile());
    expect(tree.children?.[0]?.data?.hProperties?.className).toBe('lead-p');
  });

  it('does nothing when there is no paragraph in the tree', () => {
    const tree = root(heading(2, 'Only a heading'));
    runPlugin(tree, vfile());
    expect(tree.children?.[0]?.data).toBeUndefined();
  });

  it('does NOT mark a paragraph that comes after a heading (no kernel = no drop cap)', () => {
    // If a piece opens with `## Section` instead of a kernel paragraph,
    // the first <p> in the doc lives inside section 1. Targeting that
    // paragraph with `.lead-p` would put the drop cap on the wrong
    // element. Plugin's contract: lead-p only when the FIRST top-level
    // child is a paragraph.
    const tree = root(heading(2, 'Opening section'), paragraph('First paragraph of section 1.'));
    runPlugin(tree, vfile());
    // The paragraph at index 1 gets no class; the piece simply has no
    // drop cap in this layout. CSS rule `.piece-prose > .lead-p::first-letter`
    // never fires, which is the desired fallback.
    expect(tree.children?.[1]?.data).toBeUndefined();
  });

  it('skips already-classed paragraphs (idempotent)', () => {
    const tree = root(paragraph('Opening.'));
    if (tree.children?.[0]) {
      tree.children[0].data = { hProperties: { className: 'lead-p custom-class' } };
    }
    runPlugin(tree, vfile());
    // Class string is unchanged — neither duplicated nor reordered.
    expect(tree.children?.[0]?.data?.hProperties?.className).toBe('lead-p custom-class');
  });

  it('runs even when no margin notes are present in frontmatter', () => {
    const tree = root(paragraph('Just prose.'));
    runPlugin(tree, vfile([]));
    expect(tree.children?.[0]?.data?.hProperties?.className).toBe('lead-p');
  });
});

describe('pull-quote anchor logic', () => {
  it('inserts <aside class="pull"> at the end of the matching section', () => {
    const tree = root(
      paragraph('Kernel paragraph.'),
      heading(2, 'First section'),
      paragraph('First section, paragraph 1.'),
      paragraph('First section, paragraph 2.'),
      heading(2, 'Second section'),
      paragraph('Second section content.'),
    );
    runPlugin(tree, vfile([{ section: 'first-section', text: 'Pull from first.' }]));

    // Expected order:
    //   0: paragraph (kernel)        ← also gets .lead-p
    //   1: heading (First)
    //   2: paragraph
    //   3: paragraph
    //   4: html <aside class="pull">
    //   5: heading (Second)
    //   6: paragraph
    expect(tree.children?.[4]?.type).toBe('html');
    expect(tree.children?.[4]?.value).toBe('<aside class="pull">Pull from first.</aside>');
    expect(tree.children?.[5]?.type).toBe('heading');
  });

  it('inserts at end of document when the target section is the last one', () => {
    const tree = root(
      paragraph('Kernel.'),
      heading(2, 'Only section'),
      paragraph('Body 1.'),
      paragraph('Body 2.'),
    );
    runPlugin(tree, vfile([{ section: 'only-section', text: 'Closing thought.' }]));

    // The aside lands after the last paragraph (i.e. at the end).
    const last = tree.children?.[tree.children.length - 1];
    expect(last?.type).toBe('html');
    expect(last?.value).toContain('Closing thought.');
  });

  it('handles multiple notes per section in author-supplied order', () => {
    const tree = root(
      paragraph('Kernel.'),
      heading(2, 'Section A'),
      paragraph('A body.'),
      heading(2, 'Section B'),
      paragraph('B body.'),
    );
    runPlugin(
      tree,
      vfile([
        { section: 'section-a', text: 'First quote.' },
        { section: 'section-a', text: 'Second quote.' },
      ]),
    );

    // Both quotes sit between Section A's last paragraph and Section B's heading.
    const quoteA1 = tree.children?.[3];
    const quoteA2 = tree.children?.[4];
    expect(quoteA1?.type).toBe('html');
    expect(quoteA1?.value).toContain('First quote.');
    expect(quoteA2?.type).toBe('html');
    expect(quoteA2?.value).toContain('Second quote.');
    expect(tree.children?.[5]?.type).toBe('heading');
  });

  it('silently skips when a section slug does not match any H2', () => {
    const tree = root(paragraph('Kernel.'), heading(2, 'Real section'), paragraph('Real body.'));
    const before = tree.children?.length;
    runPlugin(tree, vfile([{ section: 'nonexistent-section', text: 'Orphan note.' }]));

    // No new nodes added. The plugin doesn't throw — orphans are caught
    // separately by the e2e tests in pieces.spec.ts (the visual pass
    // notices a missing quote on the page).
    expect(tree.children?.length).toBe(before);
  });

  it('does not insert pull quotes for H3 anchors (H2-only contract)', () => {
    const tree = root(
      paragraph('Kernel.'),
      heading(2, 'Outer section'),
      paragraph('Outer body.'),
      heading(3, 'Inner subsection'),
      paragraph('Inner body.'),
    );
    runPlugin(tree, vfile([{ section: 'inner-subsection', text: 'Should not appear.' }]));

    // Plugin walks top-level children only; the H3 is at top level but
    // the plugin filters on `depth === 2`. No insertion.
    const htmlNodes = tree.children?.filter((c) => c.type === 'html') ?? [];
    expect(htmlNodes.length).toBe(0);
  });

  it('escapes special HTML characters in pull-quote text', () => {
    const tree = root(paragraph('Kernel.'), heading(2, 'Section'), paragraph('Body.'));
    runPlugin(tree, vfile([{ section: 'section', text: 'A < B & C > "D"' }]));
    const aside = tree.children?.find((c) => c.type === 'html');
    expect(aside?.value).toBe('<aside class="pull">A &lt; B &amp; C &gt; &quot;D&quot;</aside>');
  });

  it('preserves accented characters in section slugs', () => {
    // The slugger keeps Unicode letters; "Qué es CPR" → "qué-es-cpr".
    const tree = root(paragraph('Kernel.'), heading(2, 'Qué es CPR'), paragraph('Body.'));
    runPlugin(tree, vfile([{ section: 'qué-es-cpr', text: 'Acento.' }]));
    const aside = tree.children?.find((c) => c.type === 'html');
    expect(aside?.value).toContain('Acento.');
  });

  it("strips apostrophes from slugs to match Astro's anchor IDs", () => {
    // Astro's github-slugger strips apostrophes; my plugin matches.
    const tree = root(
      paragraph('Kernel.'),
      heading(2, "What I'd tell past me"),
      paragraph('Body.'),
    );
    runPlugin(tree, vfile([{ section: 'what-id-tell-past-me', text: 'Closing.' }]));
    const aside = tree.children?.find((c) => c.type === 'html');
    expect(aside?.value).toContain('Closing.');
  });
});

describe('combined behaviour', () => {
  it('lead-p + pull quote happen together on the same tree', () => {
    const tree = root(
      paragraph('Lead paragraph.'),
      heading(2, 'Section'),
      paragraph('Section body.'),
    );
    runPlugin(tree, vfile([{ section: 'section', text: 'Pull quote.' }]));

    expect(tree.children?.[0]?.data?.hProperties?.className).toBe('lead-p');
    expect(tree.children?.[tree.children.length - 1]?.type).toBe('html');
  });

  it('does not crash on empty tree', () => {
    const tree = root();
    expect(() => runPlugin(tree, vfile([{ section: 'anything', text: 'note' }]))).not.toThrow();
  });
});
