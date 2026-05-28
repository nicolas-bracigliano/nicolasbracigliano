#!/usr/bin/env node
// Post-deploy smoke test. Replaces the hardcoded `check /path 200`
// block that used to live in `.github/workflows/ci.yml`. Imports
// the canonical route map from `src/lib/routes.ts` directly (Node
// 24's TS-strip removes the type annotations at load) and
// enumerates every published content entry from `src/content/`.
//
// Invocation:
//   node scripts/smoke-routes.ts <BASE_URL>
//
// Exit codes:
//   0  every route returned the expected status
//   1  at least one route failed (after the retry budget)
//   2  invocation error (missing BASE_URL, etc.)
//
// Retry-on-4xx gotcha (per CLAUDE.md): Cloudflare Workers Static
// Assets has a brief propagation window where a just-deployed URL
// 404s while siblings serve. `curl --retry` doesn't retry 4xx —
// so we hand-roll the retry loop here too. Six attempts × 3 s
// delay = ~18 s tolerance per route, matching the bash behaviour
// that replaced this used to have.

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
// Relative path with explicit `.ts` extension is required: Node 24's
// TS-strip loader doesn't honour tsconfig path aliases (no resolver
// plugin in stock Node). Don't "fix" this back to `@lib/routes` — it
// will break CI.
import { ROUTES } from '../src/lib/routes.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const CONTENT_ROOT = join(REPO_ROOT, 'src', 'content');

const ROUTE_RETRY_ATTEMPTS = 6;
const ROUTE_RETRY_DELAY_MS = 3000;
// Body-sanity uses a smaller budget (3× × 2 s) than route checks
// (6× × 3 s) on purpose: route retries exist for Workers Static
// Assets' per-asset propagation window (a just-uploaded URL may
// 404 while siblings 200). Body sanity tests Astro build
// correctness against a known-good route (/en/) — if that route
// returned 200 in the route phase, the build is fine and 3 quick
// retries is plenty to cover transient network blips.
const BODY_RETRY_ATTEMPTS = 3;
const BODY_RETRY_DELAY_MS = 2000;

export type ContentCollection = 'notes' | 'pieces' | 'works';
export type Locale = 'en' | 'es';

export interface ContentEntry {
  collection: ContentCollection;
  slug: string;
  lang: Locale;
  status: string;
}

export interface SmokeTarget {
  path: string;
  expected: number;
}

/** Pure: given a list of discovered entries, build the full sorted
 *  smoke-target list. Static routes from `ROUTES`, then published
 *  content slugs, then a deliberate-404 sentinel appended last so
 *  the CI log reads top-down. No fs, no fetch — unit-testable. */
export function buildTargets(entries: readonly ContentEntry[]): SmokeTarget[] {
  const targets: SmokeTarget[] = [];

  // Worker-handled root redirect (Accept-Language based).
  targets.push({ path: '/', expected: 302 });

  // Static routes from ROUTES (en + es for every named route).
  for (const pair of Object.values(ROUTES)) {
    targets.push({ path: pair.en, expected: 200 });
    targets.push({ path: pair.es, expected: 200 });
  }

  // Published content slugs.
  for (const entry of entries) {
    if (entry.status !== 'published') continue;
    targets.push({
      path: `${ROUTES[entry.collection][entry.lang]}${entry.slug}/`,
      expected: 200,
    });
  }

  // Sort lexicographically so CI logs read in the same order every
  // run — adding an entry shows up as a clean one-line diff.
  targets.sort((a, b) => a.path.localeCompare(b.path));

  // Deliberate 404 fallback: confirms `not_found_handling = "404-page"`
  // is honoured at the Workers Static Assets layer. Appended after
  // the sort so it stays at the bottom of the log.
  targets.push({ path: '/this-path-does-not-exist-12345/', expected: 404 });

  return targets;
}

/** Walk the content directory and return parsed frontmatter for
 *  every markdown file under `<collection>/{en,es}/`. Supports both
 *  flat (`<slug>.md`) and directory-shaped (`<slug>/index.md`)
 *  entry layouts; Astro's content loader handles both, so the smoke
 *  script does too. */
export async function discoverEntries(contentRoot: string): Promise<ContentEntry[]> {
  const out: ContentEntry[] = [];
  const collections: ContentCollection[] = ['notes', 'pieces', 'works'];

  for (const collection of collections) {
    for (const lang of ['en', 'es'] as const) {
      const localeDir = join(contentRoot, collection, lang);
      const files = await listMarkdown(localeDir);
      for (const file of files) {
        const text = await readFile(file, 'utf-8');
        const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
        if (!fmMatch || !fmMatch[1]) continue;
        const data = parseYaml(fmMatch[1]) as { slug?: string; status?: string };
        if (typeof data.slug !== 'string' || typeof data.status !== 'string') continue;
        out.push({ collection, lang, slug: data.slug, status: data.status });
      }
    }
  }

  return out;
}

async function listMarkdown(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.md')) {
        out.push(join(dir, e.name));
      } else if (e.isDirectory()) {
        // Directory-shaped entry: <slug>/index.md beside the slug's assets.
        const inner = join(dir, e.name);
        const innerEntries = await readdir(inner).catch(() => []);
        for (const f of innerEntries) {
          if (f.endsWith('.md')) out.push(join(inner, f));
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchStatus(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    });
    return res.status;
  } catch {
    return null;
  }
}

async function checkOne(baseUrl: string, target: SmokeTarget): Promise<boolean> {
  const url = `${baseUrl}${target.path}`;
  for (let attempt = 1; attempt <= ROUTE_RETRY_ATTEMPTS; attempt++) {
    const got = await fetchStatus(url);
    if (got === target.expected) {
      console.log(`  ${target.path} → ${got} ✓`);
      return true;
    }
    if (attempt < ROUTE_RETRY_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, ROUTE_RETRY_DELAY_MS));
    } else {
      console.error(
        `::error::${target.path} expected ${target.expected}, got ${got ?? 'network-error'} (after ${ROUTE_RETRY_ATTEMPTS} attempts)`,
      );
    }
  }
  return false;
}

async function bodySanity(baseUrl: string): Promise<boolean> {
  // Status codes alone don't catch an Astro build that produces
  // empty HTML. Fetch /en/ and assert a known marker shows up
  // (the <title> tag + the site wordmark from the chrome).
  const url = `${baseUrl}/en/`;
  let lastErr = '';
  for (let attempt = 1; attempt <= BODY_RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const body = await res.text();
        if (!body.includes('<title>')) {
          lastErr = '/en/ response missing <title> — broken Astro build?';
        } else if (!body.includes('Bracigliano')) {
          lastErr = `/en/ response missing 'Bracigliano' — broken Astro build?`;
        } else {
          console.log(`  body sanity at /en/ ✓`);
          return true;
        }
      } else {
        lastErr = `/en/ returned HTTP ${res.status} during body sanity check`;
      }
    } catch (e) {
      lastErr = `/en/ fetch failed: ${(e as Error).message}`;
    }
    if (attempt < BODY_RETRY_ATTEMPTS) await new Promise((r) => setTimeout(r, BODY_RETRY_DELAY_MS));
  }
  console.error(`::error::${lastErr}`);
  return false;
}

async function main(): Promise<number> {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error('Usage: node scripts/smoke-routes.ts <BASE_URL>');
    return 2;
  }
  const normalised = baseUrl.replace(/\/$/, '');

  const entries = await discoverEntries(CONTENT_ROOT);
  const targets = buildTargets(entries);
  console.log(`Smoke-testing ${normalised} (${targets.length} routes)`);

  let failures = 0;
  for (const target of targets) {
    const ok = await checkOne(normalised, target);
    if (!ok) failures += 1;
  }

  const bodyOk = await bodySanity(normalised);
  if (!bodyOk) failures += 1;

  if (failures > 0) {
    console.error(`::error::Smoke test FAILED — ${failures} check(s) did not pass`);
    return 1;
  }
  console.log(`Smoke test passed (${targets.length} routes + body sanity)`);
  return 0;
}

// Run as CLI only when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const code = await main();
  process.exit(code);
}
