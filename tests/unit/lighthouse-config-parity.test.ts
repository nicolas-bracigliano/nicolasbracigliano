import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// PR CI splits the Lighthouse config in two:
//   - lighthouserc.json     — canonical, 16 URLs x 2 runs (main + local)
//   - lighthouserc.pr.json  — trimmed, 6 URLs x 2 runs (PR feedback)
//
// The speed-up comes from auditing fewer URLs on PRs (one per layout),
// not from cutting runs: both keep numberOfRuns: 2 so median-of-2 timing
// smooths single-run noise and the gate doesn't flake.
//
// Only `collect.url` and `collect.numberOfRuns` may differ. The `assert`
// block (the actual budget — score thresholds, Core Web Vitals,
// resource-size limits) MUST be identical, or a PR could pass a looser
// budget than main enforces, and a regression would slip in on the PR
// run only to fail post-merge. This test deep-equals the two assert
// blocks so the configs can't drift.
//
// Also pins the intended shape of each config (URL counts, run counts)
// so an accidental edit — e.g. bumping the PR config back to the full
// URL list, defeating the speed-up — fails loudly.

const ROOT = join(__dirname, '..', '..');

interface LhciConfig {
  ci: {
    collect: { url: string[]; numberOfRuns: number; settings?: unknown };
    assert: unknown;
    upload?: unknown;
  };
}

function loadConfig(file: string): LhciConfig {
  return JSON.parse(readFileSync(join(ROOT, file), 'utf-8')) as LhciConfig;
}

describe('lighthouse config parity (PR vs canonical)', () => {
  const canonical = loadConfig('lighthouserc.json');
  const pr = loadConfig('lighthouserc.pr.json');

  it('assert blocks are identical (PR cannot pass a looser budget than main)', () => {
    expect(pr.ci.assert).toEqual(canonical.ci.assert);
  });

  it('settings are identical', () => {
    expect(pr.ci.collect.settings).toEqual(canonical.ci.collect.settings);
  });

  it('upload config is identical', () => {
    expect(pr.ci.upload).toEqual(canonical.ci.upload);
  });

  it('PR config is the fast one: fewer URLs, same run count', () => {
    // The speed-up is fewer URLs, not fewer runs. If the URL counts
    // invert, the speed-up is gone.
    expect(pr.ci.collect.url.length).toBeLessThan(canonical.ci.collect.url.length);
    // Guard the trimmed set stays trim — one URL per layout, ~6.
    expect(pr.ci.collect.url.length).toBeLessThanOrEqual(7);
    // PR keeps the same run count as main (median-of-2, no flake) — never more.
    expect(pr.ci.collect.numberOfRuns).toBe(canonical.ci.collect.numberOfRuns);
    expect(pr.ci.collect.numberOfRuns).toBe(2);
  });

  it('PR URL set covers each distinct layout once', () => {
    // Representative coverage: home, notes index, note slug, about page,
    // pieces index, piece slug. If a new route/layout ships, add one
    // representative URL here so the PR run still exercises it.
    const prUrls = pr.ci.collect.url;
    const layoutProbes = [
      'http://localhost/en/', // home
      'http://localhost/en/notes/', // notes index
      'http://localhost/en/notes/hello/', // note slug
      'http://localhost/en/about/', // about page
      'http://localhost/en/pieces/', // pieces index
      'http://localhost/en/pieces/rings-i-keep-redrawing/', // piece slug
    ];
    for (const probe of layoutProbes) {
      expect(prUrls, `PR config should cover the ${probe} layout`).toContain(probe);
    }
  });

  it('every PR URL is also in the canonical config', () => {
    // The PR set is a subset — no URL should be auditable on PRs but
    // not on main (that would mean a page only ever gets a PR-run audit).
    const canonicalUrls = new Set(canonical.ci.collect.url);
    for (const url of pr.ci.collect.url) {
      expect(canonicalUrls, `${url} (PR) must also be in lighthouserc.json`).toContain(url);
    }
  });
});
