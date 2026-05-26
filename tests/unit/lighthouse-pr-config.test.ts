import { describe, expect, it, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// PR CI runs Lighthouse against a trimmed URL set so feedback stays fast.
// Rather than maintain a second config file by hand, the PR config is
// GENERATED from lighthouserc.json by scripts/lighthouse-pr-config.mjs:
// one URL per layout, with the budget (assert block), collect settings,
// numberOfRuns and upload all inherited from canonical.
//
// These tests run the real generator and pin its contract, so a future
// edit to the script can't silently let a PR run pass a looser budget
// than main enforces, or invert the speed-up by auditing the full set.

const ROOT = join(__dirname, '..', '..');

interface LhciConfig {
  ci: {
    collect: { url: string[]; numberOfRuns: number; settings?: unknown };
    assert: unknown;
    upload?: unknown;
  };
}

function load(file: string): LhciConfig {
  return JSON.parse(readFileSync(join(ROOT, file), 'utf-8')) as LhciConfig;
}

describe('lighthouse PR config generator', () => {
  let canonical: LhciConfig;
  let generated: LhciConfig;

  beforeAll(() => {
    // Generate the file the CI lighthouse step consumes on PRs.
    execFileSync('node', ['scripts/lighthouse-pr-config.mjs'], { cwd: ROOT });
    canonical = load('lighthouserc.json');
    generated = load('lighthouserc.pr.generated.json');
  });

  it('inherits the canonical assert block verbatim (PR cannot pass a looser budget)', () => {
    expect(generated.ci.assert).toEqual(canonical.ci.assert);
  });

  it('inherits collect settings and upload from canonical', () => {
    expect(generated.ci.collect.settings).toEqual(canonical.ci.collect.settings);
    expect(generated.ci.upload).toEqual(canonical.ci.upload);
  });

  it('inherits numberOfRuns from canonical (median-of-2, no flake)', () => {
    expect(generated.ci.collect.numberOfRuns).toBe(canonical.ci.collect.numberOfRuns);
    expect(generated.ci.collect.numberOfRuns).toBe(2);
  });

  it('audits fewer URLs than canonical — the speed-up', () => {
    expect(generated.ci.collect.url.length).toBeLessThan(canonical.ci.collect.url.length);
    // Guard the trimmed set stays trim — one URL per layout, ~6.
    expect(generated.ci.collect.url.length).toBeLessThanOrEqual(7);
  });

  it('covers each distinct layout once', () => {
    // Representative coverage: home, notes index, note slug, about page,
    // pieces index, piece slug. If a new route/layout ships, add a probe
    // to PR_LAYOUT_URLS in the generator and a matching line here.
    const layoutProbes = [
      'http://localhost/en/', // home
      'http://localhost/en/notes/', // notes index
      'http://localhost/en/notes/hello/', // note slug
      'http://localhost/en/about/', // about page
      'http://localhost/en/pieces/', // pieces index
      'http://localhost/en/pieces/rings-i-keep-redrawing/', // piece slug
    ];
    for (const probe of layoutProbes) {
      expect(generated.ci.collect.url, `PR config should cover ${probe}`).toContain(probe);
    }
  });

  it('every PR URL is also in canonical (no PR-only audit)', () => {
    const canonicalUrls = new Set(canonical.ci.collect.url);
    for (const url of generated.ci.collect.url) {
      expect(canonicalUrls, `${url} (PR) must also be in lighthouserc.json`).toContain(url);
    }
  });
});
