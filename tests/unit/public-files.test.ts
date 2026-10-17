import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../../scripts/check-public-files.mjs', import.meta.url));
const ignoreRules = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');

describe('public repository file check', () => {
  let root: string;

  function git(...args: string[]) {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  }

  function write(path: string) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, 'fixture\n');
  }

  function check(cwd = root) {
    return spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'public-files-test-'));
    git('init', '--quiet');
    writeFileSync(join(root, '.gitignore'), ignoreRules);
    git('add', '.gitignore');
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('allows public documentation and explicit ignore-rule exceptions from a subdirectory', () => {
    const paths = ['docs/architecture.md', 'src/content/pages/en/now.md', '.vscode/settings.json'];
    for (const path of paths) write(path);
    git('add', '--', ...paths);

    expect(check(join(root, 'docs')).status).toBe(0);
  });

  it('does not reject private files that are untracked and ignored', () => {
    write('docs/plans/release.md');
    expect(check().status).toBe(0);
  });

  it('rejects force-added private paths, including filenames with spaces and newlines', () => {
    const paths = [
      '.local/plan\nnotes.md',
      'docs/plans/nested/release plan.md',
      'docs/internal/runbook.md',
      'docs/audits/review.md',
      'docs/phase-1-infrastructure.md',
      'audit.json',
      'gitleaks-report-current.json',
      '.env.local',
      '.claude/session.md',
    ];
    for (const path of paths) write(path);
    git('add', '--force', '--', ...paths);

    const result = check();
    expect(result.status).toBe(1);
    for (const path of paths) expect(result.stderr).toContain(JSON.stringify(path));
  });

  it('passes once a private file is removed from the index, even if it remains on disk', () => {
    write('docs/internal/runbook.md');
    git('add', '--force', 'docs/internal/runbook.md');
    expect(check().status).toBe(1);

    git('rm', '--cached', 'docs/internal/runbook.md');
    expect(check().status).toBe(0);
  });

  it('fails closed when the repository ignore rules cannot be read', () => {
    rmSync(join(root, '.gitignore'));
    expect(check().status).toBe(1);
  });
});
