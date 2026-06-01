// Single source for the build version string shown in the home masthead
// eyebrow ("en proceso, en público · v.X.Y.Z"). Read from package.json so
// the eyebrow can never drift from the actual release — it previously
// hardcoded `v.1.11.1` in both index pages while package.json was already
// at 1.13.0. Imported only in server-side `.astro` frontmatter, so
// package.json is read at build time and never shipped to the client.
import pkg from '../../package.json';

export const VERSION: string = pkg.version;
