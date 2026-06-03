// `.txt` imports resolve to the file's string content. In production
// this is wired by the wrangler `Text` module rule in `wrangler.toml`;
// under vitest by the `raw-text` plugin in `vitest.config.ts`. Used by
// `src/worker.ts` to bundle `public/.well-known/security.txt`.
declare module '*.txt' {
  const content: string;
  export default content;
}
