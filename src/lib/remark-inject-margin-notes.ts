// Remark plugin: inject margin-note HTML elements into markdown right
// after the heading whose computed slug matches `marginNotes[i].section`
// in the frontmatter. Wired in `astro.config.ts`.
//
// Why REMARK, not rehype: Astro's heading-anchor IDs (`<h2 id="...">`)
// are added LATER in the pipeline than user rehype plugins. A user-
// stage rehype plugin sees `<h2>` elements with no `id` attribute, so
// matching against `note.section` is impossible. Running at the remark
// stage means we have the heading's TEXT (not yet slugified) and can
// compute the same slug Astro will eventually emit, then insert an
// HTML element as a sibling of the heading.
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
// cache. Run `rm -rf node_modules/.astro` to force a rebuild during
// local development. CI builds always start clean.

interface MarginNote {
  section: string;
  text: string;
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
 *  context. Margin note text is plain prose from frontmatter; escaping
 *  ampersands, angle brackets, and quotes is the conservative move. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMarginNoteHtml(note: MarginNote): string {
  const mark = escapeHtml(note.mark ?? '↳');
  const text = escapeHtml(note.text);
  return (
    `<div class="margin-note margin-note--inline">` +
    `<span class="margin-mark" aria-hidden="true">${mark}</span>` +
    `<p>${text}</p>` +
    `</div>`
  );
}

function injectAfterHeadings(node: MdastNode, notesBySection: Map<string, MarginNote[]>): void {
  if (!node.children) return;
  let i = 0;
  while (i < node.children.length) {
    const child = node.children[i];
    if (!child) {
      i++;
      continue;
    }
    if (child.type === 'heading') {
      const slug = slugify(nodeText(child as MdastInlineNode));
      const notes = notesBySection.get(slug);
      if (notes && notes.length > 0) {
        const inserts: MdastNode[] = notes.map((n) => ({
          type: 'html',
          value: buildMarginNoteHtml(n),
        }));
        node.children.splice(i + 1, 0, ...inserts);
        i += inserts.length + 1;
        continue;
      }
    }
    injectAfterHeadings(child, notesBySection);
    i++;
  }
}

export default function remarkInjectMarginNotes() {
  return (tree: MdastNode, file: VFile): void => {
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

    injectAfterHeadings(tree, notesBySection);
  };
}
