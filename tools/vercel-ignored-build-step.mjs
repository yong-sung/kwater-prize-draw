import { spawnSync } from 'node:child_process';

// Vercel Ignored Build Step command: node tools/vercel-ignored-build-step.mjs
export const MONITORING_ALLOWLIST = new Set([
  'tools/preview-availability-check.mjs',
  'tools/preview-availability-check.test.mjs',
  'tools/preview-availability-contract.test.mjs',
  'tools/vercel-ignored-build-step.mjs',
  'tools/vercel-ignored-build-step.test.mjs',
  '.github/workflows/preview-availability.yml',
]);

export function shouldBuild(changedFiles) {
  return changedFiles.some((file) => !MONITORING_ALLOWLIST.has(file));
}

export function changedFiles(previousSha, currentSha, runner = spawnSync) {
  const result = runner('git', ['diff', '--name-only', previousSha, currentSha], { encoding: 'utf8' });
  if (result.status !== 0 || typeof result.stdout !== 'string') throw new Error(result.stderr || 'git diff failed');
  const files = result.stdout.split(/\r?\n/).map((file) => file.trim()).filter(Boolean);
  if (files.some((file) => file.includes('\0') || file.includes('\n') || file.includes('\r'))) throw new Error('git diff output parse failed');
  return files;
}

export function main(env = process.env, runner = spawnSync) {
  if (env.VERCEL_ENV !== 'production') {
    console.log('Non-production deployment; build required.');
    return 1;
  }
  const previous = env.VERCEL_GIT_PREVIOUS_SHA;
  const current = env.VERCEL_GIT_COMMIT_SHA;
  if (!previous || !current) {
    console.log('Missing Vercel commit SHA; build required.');
    return 1;
  }
  let files;
  try { files = changedFiles(previous, current, runner); } catch (error) { console.log(`${error.message}; build required.`); return 1; }
  if (shouldBuild(files)) { console.log(`Non-monitoring changes (${files.length}); build required.`); return 1; }
  console.log('Only monitoring changes; build ignored.');
  return 0;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) process.exitCode = main();
