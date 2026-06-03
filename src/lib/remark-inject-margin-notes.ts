// Remark plugin: inject editorial elements into a piece's markdown AST
// at build time. Two responsibilities, both wired in `astro.config.ts`:
//
//   1. PULL QUOTES (formerly "margin notes"). For each
//      `marginNotes: [{ section, text }]` frontmatter entry, find the H2
//      whose computed slug matches `section`, then insert an
//      `<p class="pull">` AFTER the last paragraph of that section
//      (i.e. immediately before the next H2 at the same level, or before
//      the end of the document if the section is last). This anchor
//      logic matches the prototype's pull-quote placement, where the
//      quote summarises or extracts from the section above rather than
//      introducing it.
//
//   2. LEAD-PARAGRAPH CLASS. The first paragraph of the body gets
//      `class="lead-p"` so the drop-cap rule (§9, `.piece-prose >
//      .lead-p::first-letter`) can target it without relying on
//      `:first-of-type` (which is fragile against future remark plugins
//      that might inject siblings ahead of the first `<p>`).
//
// Why REMARK, not rehype: Astro's heading-anchor IDs (`<h2 id="...">`)
// are added LATER in the pipeline than user rehype plugins. A user-
// stage rehype plugin sees `<h2>` elements with no `id` attribute, so
// matching against `note.section` is impossible. Running at the remark
// stage means we have the heading's TEXT (not yet slugified) and can
// compute the same slug Astro will eventually emit, then insert HTML
// elements at the right position in the tree.
//
// Slug algorithm: matches github-slugger's behaviour closely enough for
// the heading texts we use (plain prose with apostrophes, commas, and
// occasional accented characters). Lowercased; strip apostrophes; any
// other non-letter/number char becomes a hyphen; collapse hyphens.
// Unicode property escapes preserve accented letters so `Por qué...`
// slugifies to `por-qué-...` to match Astro's output. We keep this
// inline rather than depend on `github-slugger` directly because
// strict pnpm doesn't expose it as a direct dependency.
//
// Cache caveat: edits to this plugin don't invalidate Astro's content
// cache. Run `rm -rf node_modules/.astro .astro` to force a rebuild
// during local development. CI builds always start clean.

interface MarginNote {
  section: string;
  text: string;
  /** Reserved from the marginalia era. Ignored by the pull-quote
   *  rendering — the `↳` glyph no longer appears; emphasis is carried
   *  by type weight and the accent left-border. */
  mark?: string;
}

interface MdastInlineNode {
  type: string;
  value?: string;
  children?: MdastInlineNode[];
}

interface MdastNode {
  type: string;
  depth?: number;
  value?: string;
  children?: MdastNode[];
}

/** Internal shape we cast to when writing `data.hProperties.className`.
 *  Each mdast node type has its own data shape; we only ever read/write
 *  the `hProperties` slot on a paragraph node here. Kept as a local
 *  type so the public `MdastNode` interface stays minimal and the cast
 *  is documented at the point of use. */
type WithHProperties = {
  data?: { hProperties?: { className?: string } };
};

interface VFile {
  data?: {
    astro?: {
      frontmatter?: {
        marginNotes?: MarginNote[];
      };
    };
  };
}

/** Flatten inline mdast children to their text content. */
function nodeText(node: MdastInlineNode): string {
  if (node.type === 'text' && typeof node.value === 'string') return node.value;
  if (node.children) return node.children.map(nodeText).join('');
  return '';
}

/** Slugify the way github-slugger (Astro's choice) does, for the
 *  heading texts we actually use. Preserves accented letters via
 *  Unicode property escapes; matches Astro's `<h2 id="...">` output. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['‘’“”]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** Escape a string for safe interpolation inside an HTML text content
 *  context. Pull-quote text is plain prose from frontmatter; escaping
 *  ampersands, angle brackets, and quotes is the conservative move. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPullQuoteHtml(note: MarginNote): string {
  // `<p>` not `<aside>`: per the project's memory rule (and html-validate's
  // `unique-landmark`), multiple `<aside>` siblings need unique aria-labels
  // because each is a landmark. Pieces have N>1 pull quotes by design, so
  // they can't carry landmark semantics. A `<p class="pull">` is the right
  // primitive — pull quotes are typographic emphasis inside prose, not a
  // page-level aside. Same CSS rule (`.pull`) matches.
  return `<p class="pull">${escapeHtml(note.text)}</p>`;
}

/** Mark the lead paragraph with `class="lead-p"` via mdast's
 *  `data.hProperties.className`. Idempotent — running twice produces
 *  the same result.
 *
 *  Constraint: the lead paragraph must be the very FIRST top-level
 *  child of the tree. If the piece opens with a heading (no kernel
 *  paragraph above the first H2), no class is injected — the drop cap
 *  would otherwise land on the first paragraph INSIDE the first
 *  section, which reads as a typo. The piece simply gets no drop cap
 *  in that case, which is the right fallback. */
function markLeadParagraph(tree: MdastNode): void {
  if (!tree.children || tree.children.length === 0) return;
  const first = tree.children[0];
  if (!first || first.type !== 'paragraph') return;
  const para = first as MdastNode & WithHProperties;
  const data = (para.data = para.data ?? {});
  const hProperties = (data.hProperties = data.hProperties ?? {});
  const existing = hProperties.className;
  if (typeof existing === 'string' && existing.includes('lead-p')) return;
  hProperties.className = existing ? `${existing} lead-p` : 'lead-p';
}

/** Insert pull quotes at the end of each section. For each match in
 *  `notesBySection`, walk forward from the matching H2 to find the
 *  index just before the next H2 of equal-or-shallower depth (or end of
 *  document), then splice an `<p class="pull">` node at that index.
 *
 *  Only operates on the top-level children. Pull quotes are an editorial
 *  affordance for sectioned long-form prose; nested injection points
 *  aren't part of the contract. */
function injectAtSectionEnds(tree: MdastNode, notesBySection: Map<string, MarginNote[]>): void {
  if (!tree.children) return;
  // Group pending inserts by insertion index so multiple notes for the
  // same section splice as a single batch (preserves author order).
  // Splicing one-at-a-time at the same index reverses the author order
  // because each splice pushes the previous insert one position later.
  const insertsByIndex = new Map<number, MdastNode[]>();
  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i];
    if (!child || child.type !== 'heading' || child.depth !== 2) continue;
    const slug = slugify(nodeText(child as MdastInlineNode));
    const notes = notesBySection.get(slug);
    if (!notes || notes.length === 0) continue;
    // Find the end of this section: the index of the next H2 (or any
    // shallower heading), or `tree.children.length` if this is the last
    // section.
    let endIndex = tree.children.length;
    for (let j = i + 1; j < tree.children.length; j++) {
      const sibling = tree.children[j];
      if (sibling && sibling.type === 'heading' && (sibling.depth ?? Infinity) <= 2) {
        endIndex = j;
        break;
      }
    }
    const insertAfter = endIndex - 1;
    const batch = insertsByIndex.get(insertAfter) ?? [];
    for (const note of notes) {
      batch.push({ type: 'html', value: buildPullQuoteHtml(note) });
    }
    insertsByIndex.set(insertAfter, batch);
  }
  // Apply batches in reverse index order so earlier indices stay valid
  // across mutations.
  const sortedIndices = Array.from(insertsByIndex.keys()).sort((a, b) => b - a);
  for (const afterIndex of sortedIndices) {
    const batch = insertsByIndex.get(afterIndex);
    if (!batch || batch.length === 0) continue;
    tree.children.splice(afterIndex + 1, 0, ...batch);
  }
}

export default function remarkInjectMarginNotes() {
  return (tree: MdastNode, file: VFile): void => {
    // Always mark the lead paragraph — independent of margin-note presence.
    markLeadParagraph(tree);

    const marginNotes = file.data?.astro?.frontmatter?.marginNotes ?? [];
    if (marginNotes.length === 0) return;

    const notesBySection = new Map<string, MarginNote[]>();
    for (const note of marginNotes) {
      if (!note.section) continue;
      const list = notesBySection.get(note.section) ?? [];
      list.push(note);
      notesBySection.set(note.section, list);
    }
    if (notesBySection.size === 0) return;

    injectAtSectionEnds(tree, notesBySection);
  };
}
