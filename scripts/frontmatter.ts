// Single shared frontmatter reader for dev-time code — the pnpm-new
// scaffold and the unit-test helpers. Before this module, four call
// sites hand-rolled the same `^---` fence regex + YAML parse (the async
// test helper, the bilingual-pairs and now-items test loaders, and
// new-content's published-works scan); they could drift on edge cases
// (missing fence, stray `---` in a value) without anything noticing.
//
// Pure text-in/data-out — no fs here, so callers keep their own
// sync/async I/O and their own missing-frontmatter policy (throw vs
// skip).
//
// NOT for production (`src/`) code: `yaml` is a devDependency, and Astro
// parses content frontmatter itself at build time. Tooling layer only.

import { parse as parseYaml } from 'yaml';

/** Parsed YAML frontmatter of a markdown file's text — the block between
 *  the leading `---` fence pair — or `null` when the text doesn't open
 *  with one. */
export function frontmatterOf(text: string): Record<string, unknown> | null {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  return m && m[1] ? (parseYaml(m[1]) as Record<string, unknown>) : null;
}
