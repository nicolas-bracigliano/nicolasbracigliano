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
import { ROUTES } from '../src/lib/routes.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const CONTENT_ROOT = join(REPO_ROOT, 'src', 'content');

const MAX_ATTEMPTS = 6;
const DELAY_MS = 3000;

interface SmokeTarget {
  path: string;
  expected: number;
}

/** Parse the YAML frontmatter block of a markdown file just well
 *  enough to read `slug`, `lang`, and `status`. The full Astro Zod
 *  validator runs at build time; here we just need the values to
 *  build a URL, so a regex line-parser is enough and avoids pulling
 *  in `yaml` as a runtime dep for the script. */
function parseFrontmatter(text: string): Record<string, string> {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match || !match[1]) return {};
  const out: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*['"]?([^'"#\n]+?)['"]?\s*(?:#.*)?$/);
    if (m && m[1] && m[2]) out[m[1]] = m[2].trim();
  }
  return out;
}

async function listMarkdown(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const out: string[] = [];
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.md')) out.push(join(dir, e.name));
      else if (e.isDirectory()) {
        // Support the directory-shaped entry layout (`<slug>/index.md`).
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

async function buildTargetList(): Promise<SmokeTarget[]> {
  const targets: SmokeTarget[] = [];

  // Worker-handled root redirect (Accept-Language based).
  targets.push({ path: '/', expected: 302 });

  // Static routes from ROUTES (en + es for every named route).
  for (const pair of Object.values(ROUTES)) {
    targets.push({ path: pair.en, expected: 200 });
    targets.push({ path: pair.es, expected: 200 });
  }

  // Published content slugs for the three content collections.
  const collections = [
    { key: 'notes', route: ROUTES.notes },
    { key: 'pieces', route: ROUTES.pieces },
    { key: 'works', route: ROUTES.works },
  ] as const;

  for (const { key, route } of collections) {
    for (const locale of ['en', 'es'] as const) {
      const dir = join(CONTENT_ROOT, key, locale);
      const files = await listMarkdown(dir);
      for (const file of files) {
        const fm = parseFrontmatter(await readFile(file, 'utf-8'));
        if (fm['status'] !== 'published') continue;
        const slug = fm['slug'];
        if (!slug) continue;
        targets.push({ path: `${route[locale]}${slug}/`, expected: 200 });
      }
    }
  }

  // Sort lexicographically so CI logs read in the same order every
  // run — adding a new entry shows up as a clean one-line diff.
  targets.sort((a, b) => a.path.localeCompare(b.path));

  // Deliberate 404 fallback: confirms `not_found_handling = "404-page"`
  // is honoured at the Workers Static Assets layer. Appended after
  // the sort so it stays at the bottom of the log.
  targets.push({ path: '/this-path-does-not-exist-12345/', expected: 404 });

  return targets;
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
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const got = await fetchStatus(url);
    if (got === target.expected) {
      console.log(`  ${target.path} → ${got} ✓`);
      return true;
    }
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    } else {
      console.error(
        `::error::${target.path} expected ${target.expected}, got ${got ?? 'network-error'} (after ${MAX_ATTEMPTS} attempts)`,
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
  for (let attempt = 1; attempt <= 3; attempt++) {
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
    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
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

  const targets = await buildTargetList();
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

const code = await main();
process.exit(code);
