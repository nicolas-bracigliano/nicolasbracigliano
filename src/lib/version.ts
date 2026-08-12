// Single source for the build version shown in the global footer. Read from
// package.json so the displayed version can never drift from the actual
// release. Imported only in server-side `.astro` frontmatter, so
// package.json is read at build time and never shipped to the client.
import pkg from '../../package.json';

export const VERSION: string = pkg.version;
