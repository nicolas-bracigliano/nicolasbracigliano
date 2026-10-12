// Use the repository's ignore rules to reject force-added private files.
// Inspect the Git index so local staged removals and CI checkouts agree.
import { execFileSync } from 'node:child_process';

try {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).trimEnd();
  const blocked = execFileSync(
    'git',
    ['ls-files', '--cached', '--ignored', '--exclude-from=.gitignore', '-z'],
    { cwd: root, encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);

  if (blocked.length > 0) {
    console.error('Ignored files must not be tracked in this public repository:');
    for (const path of blocked) console.error(`  ${JSON.stringify(path)}`);
    console.error(
      'Remove these paths from the Git index and keep private documents outside the repository.',
    );
    process.exitCode = 1;
  } else {
    console.log('Public repository file check passed.');
  }
} catch {
  console.error('Could not check tracked files against the repository .gitignore.');
  process.exitCode = 1;
}
