# Changelog

## [1.16.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.15.0...v1.16.0) (2026-06-01)


### Features

* **art:** redesign kind vignettes as crafted, animated illustrations ([d4de2d1](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/d4de2d1e78c17e3f4e4152a17a307c12f4954b62))


### Refactors

* **art:** unify per-kind vignettes into one shared source each ([1b9ae25](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/1b9ae25bdcf6a380fa402ba585a10459d6fa7f04))
* **content:** comment out garden section in now.md for both English and Spanish ([1e3beb6](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/1e3beb63593c1faab08d9e9d1a311916f1d7a2c5))

## [1.15.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.14.2...v1.15.0) (2026-06-01)


### Features

* **content:** round 1 — publish guitar/coffee notes, remove inaccurate Milonga content ([cac82be](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/cac82be4a4c85ea5acdb2b802b4b6cf8a2dd04f8))

## [1.14.2](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.14.1...v1.14.2) (2026-06-01)


### Bug Fixes

* **cmdk:** rank exact matches above fuzzy subsequence hits across kind groups ([2d628bf](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/2d628bf78c0ef2d0adc08cd1cdf397b851a1da45))
* **cmdk:** rank exact matches above fuzzy subsequence hits across kind groups ([dbdf2bc](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/dbdf2bc13a7cb1b57a79da699aeb311bc2f2920b))

## [1.14.1](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.14.0...v1.14.1) (2026-06-01)


### Bug Fixes

* **deps:** update dependency @astrojs/sitemap to v3.7.3 ([493280f](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/493280f51437668dcae9727f82bc791394d15572))


### Refactors

* **types:** replace fixable `as` casts with type-system-carried invariants ([6d99c02](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/6d99c0285f59851278ba2e2edcd07fa37bd4bc67))
* **types:** replace fixable as-casts with type-system-carried invariants ([f40ff09](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/f40ff09b46673f79336212637731043cb04e4db8))

## [1.14.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.13.0...v1.14.0) (2026-06-01)


### Features

* ⌘K command palette as the site's search ([#99](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/99)) ([f37ee53](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/f37ee53d01d50c8ad4b0802bdff5819e61c0bcf4))
* add 'home' filter and corresponding labels to WorksFilters component ([e34ecf5](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/e34ecf53342e507c15c6fe4caa71a4d4dda99458))
* add 'Stone & Wood' project and update home vignette ([c653f2c](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/c653f2c649b9fe044224c38c1b986c11f0f7c9d9))
* implement 'home' vignette and styles for BenchCard and ContentArt components ([c6c69dd](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/c6c69dd21412d1668558a1e05a7a4d3ac8e8b38b))
* ship the ⌘K command palette and unified bench/now ([76b80a0](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/76b80a071a9ed52d5e03a5e51e70b5d7ae41a152))


### Bug Fixes

* **content:** correct ES/EN copy and dedupe the Stone & Wood catalog number ([660ac6d](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/660ac6dc14eee87d97f24295bbb8527c44335d4a))
* **e2e:** compute the about-byline month in Australia/Melbourne ([6c4cfee](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/6c4cfeeef83e88df93438fbb3b03fd5ab2fd0b2f))
* update terminal build log in Code.astro vignette ([115fb51](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/115fb515fbe41de8a0f39c82374cc81252860f91))


### Refactors

* **markdown:** migrate to markdown.processor: unified({...}) ([a2c36da](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/a2c36dad91b1b09f27682c9507ae508b8c4d0b0c))
* unify home bench and /now onto a single source ([#97](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/97)) ([919aed8](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/919aed811ffea99bbac290e795f2622268c09ac9))
* update filter display and content status across works ([93e2dfa](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/93e2dfac4b860d71debe7795be88f7e6da1c9f0e))

## [1.13.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.12.0...v1.13.0) (2026-05-28)


### Features

* **scripts:** pnpm new — scaffold bilingual content ([#93](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/93)) ([1488135](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/148813599058c504bcb3f48a086733cef9144e2d))

## [1.12.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.11.2...v1.12.0) (2026-05-28)


### Features

* **content:** per-entry SVG art via hero, drop art and glyph enums ([#90](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/90)) ([baf60b8](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/baf60b8cc11efcaf52f9b118af22c1ce26ee94e9))

## [1.11.2](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.11.1...v1.11.2) (2026-05-28)


### Refactors

* **content:** unify ContentKind and rename translationKey to translationId ([#88](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/88)) ([60ab7b5](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/60ab7b58a59380141049c4c7f71f6fdca4fdbb3d))

## [1.11.1](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.11.0...v1.11.1) (2026-05-28)


### Refactors

* **home:** guard the Latest-entries feed kinds at compile time ([#86](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/86)) ([d6a6d7f](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/d6a6d7f94f24c4755aec10638deda02ab7cb3b48))

## [1.11.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.10.1...v1.11.0) (2026-05-27)


### Features

* **home:** drive bench + latest entries from content ([#83](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/83)) ([36e40a6](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/36e40a6e31c5109293fc9092c180582adaa26ea9))

## [1.10.1](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.10.0...v1.10.1) (2026-05-27)


### Bug Fixes

* **diagrams:** raise CPR sublabel to ink-2 for legibility ([#82](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/82)) ([ac04ab4](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/ac04ab4766c2504f0bcb4b413b36058120058c35))

## [1.10.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.9.2...v1.10.0) (2026-05-27)


### Features

* **about:** move prose to content-driven markdown + integrate legacy bio ([#80](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/80)) ([c29d56e](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/c29d56e6904c3d532b8a55cab99a9e457a43d9d0))

## [1.9.2](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.9.1...v1.9.2) (2026-05-27)


### CI / Tooling

* **lighthouse:** cut PR Lighthouse runtime with a trimmed PR config ([#78](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/78)) ([184cff8](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/184cff802a48cd85a12ce5072bd9d684cfb1982c))

## [1.9.1](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.9.0...v1.9.1) (2026-05-26)


### Documentation

* **design-system:** codify voice and piece-shape standards as a writer's guide ([#76](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/76)) ([9ab4c44](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/9ab4c449017e41a18c650950df31e14a21ddb291))

## [1.9.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.8.0...v1.9.0) (2026-05-26)


### Features

* **diagrams:** multi-colour diagrams via per-role CSS custom properties ([#75](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/75)) ([e617305](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/e617305ace35e257926a68de0ef977c854a3738d))
* **pieces:** editorial layout for slowed-down reading ([#74](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/74)) ([16c5298](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/16c52985fb87de38bba8ecb8fd45fabf4d46a6af))
* **pieces:** migrate four legacy posts with rewrites and translations ([#72](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/72)) ([9231ff8](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/9231ff806cc24616e336a070aa7e388d5c570487))

## [1.8.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.7.6...v1.8.0) (2026-05-25)


### Features

* **diagrams:** add reusable SVG diagram components ([#70](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/70)) ([b28d280](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/b28d28088e617d3528f2108c3ec169c54e93f1fe))

## [1.7.6](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.7.5...v1.7.6) (2026-05-25)


### Refactors

* **pieces:** rename essays to pieces and ship empty visual treatment ([#68](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/68)) ([5e1046e](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/5e1046e007d88297485e18b597d3b81d3a38ae34))

## [1.7.5](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.7.4...v1.7.5) (2026-05-25)


### Documentation

* **adr-0004:** postscript — Renovate is active via Mend portal ([#66](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/66)) ([43bd242](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/43bd242f01d2f1f8305ad7a88210c3f68371680c))

## [1.7.4](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.7.3...v1.7.4) (2026-05-25)


### Documentation

* **readme:** rewrite for public release — architecture-first framing ([#61](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/61)) ([1c44d8c](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/1c44d8c382906976c3ddc8aa52ab2f5c9c75235a))

## [1.7.3](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.7.2...v1.7.3) (2026-05-25)


### Bug Fixes

* **security:** enhance license check to exclude private packages ([#56](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/56)) ([9d5c0b2](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/9d5c0b2fee1b253ee240854c050aea2bea66b1b1))

## [1.7.2](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.7.1...v1.7.2) (2026-05-24)


### Bug Fixes

* externalize hoisted scripts + route-chrome polish for CSP-served Worker ([#53](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/53)) ([96a80ac](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/96a80ac9a1db2d5a4d56801d1f507bc6c11ef4b4))
* **worker:** run_worker_first so `/` redirect actually fires in production ([#54](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/54)) ([6b6b205](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/6b6b2057a17532db3c9136a3f1677527ae4e777a))

## [1.7.1](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.7.0...v1.7.1) (2026-05-24)


### CI / Tooling

* tier-B hardening — path filters, expanded smoke, security headers, preview comment, docs ([#51](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/51)) ([728cbba](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/728cbba4ab531d1f8a2827fb0c56e993b6d5a403))

## [1.7.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.7...v1.7.0) (2026-05-24)


### Features

* **ci:** migrate Cloudflare Pages → Workers Static Assets (Path A) ([#49](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/49)) ([e22f74f](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/e22f74f9489ec4397d1072bd0a311e45c1323669))

## [1.6.7](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.6...v1.6.7) (2026-05-24)


### Bug Fixes

* **lefthook:** origin/HEAD fallback for signed-commits range resolution ([#45](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/45)) ([495d2c4](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/495d2c4da2a5c2fb46a97f6f72c1465b10fe7e39))

## [1.6.6](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.5...v1.6.6) (2026-05-24)


### Refactors

* **now:** migrate /now items from inline TS arrays to YAML frontmatter ([#44](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/44)) ([ab29d59](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/ab29d59939f863fb4f5327f329f9fc5813b8ebad))


### Documentation

* **phase-0:** add infrastructure setup checklist ([#43](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/43)) ([60510e4](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/60510e458d1f55417f5da86820828e123959ee24))

## [1.6.5](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.4...v1.6.5) (2026-05-24)


### Bug Fixes

* **notes:** hide the "→ link" permalink on the single-note-entry page ([#41](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/41)) ([7611c9f](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/7611c9f267e8ea23b3488da5a8d5911b796a0ab1))

## [1.6.4](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.3...v1.6.4) (2026-05-24)


### Bug Fixes

* **css:** six best-practice cleanups (!important, z-tokens, color-scheme, ::selection, print) ([#40](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/40)) ([0d5b5b1](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/0d5b5b1b4fd8390c7e41c53afe93b761ad5cf6cd))


### Refactors

* **css:** split base.css per-route into src/styles/routes/ ([#37](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/37)) ([2f46282](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/2f4628298b56694bd45d9292be6d2f2a3fac96fd))

## [1.6.3](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.2...v1.6.3) (2026-05-24)


### Bug Fixes

* **deps:** pin patched transitives for 4 advisories via pnpm overrides ([#33](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/33)) ([76f0ec1](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/76f0ec14ea88ca4dbc7697d499d8c4388bc6733e))

## [1.6.2](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.1...v1.6.2) (2026-05-24)


### Bug Fixes

* **types:** tighten two cast sites on the OG route ([#31](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/31)) ([56e5686](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/56e5686397485a85ee28cd60ea37d29c64062707))

## [1.6.1](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.6.0...v1.6.1) (2026-05-24)


### Bug Fixes

* **css:** promote `.eyebrow` and `.sep` to global utilities ([#28](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/28)) ([5cb9cb8](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/5cb9cb8f79a8b33b07436fdb6c4583ed5cd0f73b))

## [1.6.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.5.0...v1.6.0) (2026-05-24)


### Features

* **404:** full prototype-parity Misplaced letter ([#25](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/25)) ([9af42d7](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/9af42d7193d3365ee7d282a1d8de39efa6244901))

## [1.5.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.4.0...v1.5.0) (2026-05-23)


### Features

* **now:** full prototype-parity Numbered bench tour ([#23](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/23)) ([b4999fc](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/b4999fcdb81b937da929a93404a0c33ff1f80220))

## [1.4.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.3.0...v1.4.0) (2026-05-23)


### Features

* **about:** full prototype-parity Editorial layout ([#22](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/22)) ([9d02a62](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/9d02a62c32190c565978ee10225ccfc270b6bb76))
* **mate:** redesigned gourd-and-bombilla vignette + bio rewording ([#20](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/20)) ([364848b](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/364848b19d093ebee085c2a323aa70204973b93e))

## [1.3.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.2.1...v1.3.0) (2026-05-23)


### Features

* **colophon:** full prototype-parity Typewriter credits roll ([#14](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/14)) ([3dc0e65](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/3dc0e6546be04b6f1afb0573b8f31292ede03c99))
* **meta:** wire OG cards and auto reading-time ([#11](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/11)) ([b192859](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/b1928591de03cf097ff76bd75780eb1fd92a5e05))
* **works:** full prototype-parity Index-card catalog ([#17](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/17)) ([3a757ff](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/3a757ffcf99344162d851dfe703548152b2447fd))


### Bug Fixes

* **colophon:** self-critique follow-ups (6 items) ([#15](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/15)) ([e3eb35b](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/e3eb35b8d7138a2c18c59014e997bf980c88a6c0))
* **meta:** staff-critique follow-ups (11 items) ([#13](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/13)) ([e86dc02](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/e86dc023a0e5d95fc099eaf16c59d697e5310bca))
* **notes:** drop dead glyphMap + extract NoteGlyph + structural tests ([#16](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/16)) ([5633a38](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/5633a3846fe48b5810588866452caabe38129c65))
* **works:** self-critique follow-ups (5 items) ([#18](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/18)) ([8af1ecc](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/8af1ecc5a416a52ba24100f067d096a3c0f32e2b))
* **works:** self-critique follow-ups + per-work art (7 items) ([#19](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/19)) ([e3ac966](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/e3ac966f01b6969b074e332cfc442d6a71e7c572))

## [1.2.1](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.2.0...v1.2.1) (2026-05-23)


### Bug Fixes

* **notes:** note-body width collapse + mobile date wrap ([#8](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/8)) ([74996f8](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/74996f82400659f3a6355987a8d244ba5a76170a))

## [1.2.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.1.0...v1.2.0) (2026-05-23)


### Features

* **notes:** full prototype-parity Marginalia notebook ([#6](https://github.com/nicolas-bracigliano/nicolasbracigliano/issues/6)) ([20ca9b4](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/20ca9b4052091a4f944bea9914def548e2d233cf))

## [1.1.0](https://github.com/nicolas-bracigliano/nicolasbracigliano/compare/v1.0.0...v1.1.0) (2026-05-23)


### Features

* **chrome:** close remaining prototype-parity gaps ([1886e5f](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/1886e5ff5113ef7f1ff34fa7412e6796056ccfce))
* **chrome:** cube mark + split-name + responsive compact mode ([14680af](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/14680af75708ff550908499d37b6bdc8c1596419))
* **chrome:** cube mark with split-name + responsive compact mode ([dc282b9](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/dc282b9e4c239bdd1d708882ed58a960ebd4395a))
* **chrome:** mobile foot-rail nav, scroll-aware ([ec9ed52](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/ec9ed526b4122cca23a6cce16f81252f739f4050))


### Bug Fixes

* **chrome:** distinct aria-label on foot-rail nav (html-validate) ([12f3dad](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/12f3dad96cb3192f5e7d8d03ed7a62eb220df72f))
* **chrome:** drop mark view-transition — 3D cube flickers on lang change ([9334641](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/933464172ccad0659f581ff1271cefd40ab0d614))
* **chrome:** foot-rail was trapped inside chrome by backdrop-filter ([bbd1c33](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/bbd1c332a11446bd18bfa2a452755bfc3bafbf71))
* **chrome:** home in nav + underline gap + lang-chip centering + drop view-transition on mark ([5b063e0](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/5b063e0e15be507542c44312c5bb0532a076bdd9))
* **chrome:** lang chip — split tap target from visible chip ([de69f20](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/de69f204894d3cf42b59036544aec229ab2b2c35))
* **chrome:** restore wordmark + lang toggle on mobile, compress instead of hide ([e3e49dc](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/e3e49dcd40e46cda431eabb39fb8d6edfd44f3ce))
* **chrome:** right-justify lang + theme toggles on mobile ([d47d80b](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/d47d80bd50a371bd0fa4383d4663fa619ae77960))


### Refactors

* **chrome:** 3D Y-rotation cube + name colour swap, no underline on hover ([ac4a25b](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/ac4a25b6dd8a8ef0bb3a831f6cde6fa02c0898fd))
* **chrome:** extract JS to module, matchMedia-gate scroll, merge page-load, add visual snapshots ([6d048e8](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/6d048e868f2339f916d85ee361c10fe6e947503e))
* **chrome:** staff-critique cleanup — 9 items ([7217884](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/7217884c45f5f74dca18740cb3c917d85f0a6726))

## 1.0.0 (2026-05-22)


### Features

* **motion:** wire native View Transitions + animation vocabulary ([bf92cb4](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/bf92cb4bff5d9736792ab6751f955e223607d226))
* **theme:** override silently retires when OS catches up ([41a7c76](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/41a7c76b629e1079c40767e3e6bce89d9719b61e))
* **theme:** port the prototype's filled sun-and-mask icon + animation ([f6b5b2b](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/f6b5b2bac9de31cbf59ace31d3103fbfa8a0b6e0))
* **theme:** sun/moon SVG icons reflecting the active theme ([0d2d502](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/0d2d502b4838ee74e9fa07295aa946e30f6da603))


### Bug Fixes

* **a11y:** contrast tokens + remove animations that broke axe checks ([1658595](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/16585959e3dd5fd896cd4edfd48a92a0b1e158df))
* **theme:** full resolution + cross-tab sync + OS-toggle reactivity ([289e792](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/289e7921f96874837582d09b7b053bf1c2f83bbf))
* **theme:** prevent dark-mode FOUC across ClientRouter navigations ([af43153](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/af43153d3f95ade5a713829c4a0f47a25d3e7970))
* **theme:** proper SVG &lt;mask&gt; for crescent + hover-only rotation ([178f928](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/178f928ffd3f3e4b57e77d5bd2f8e80ca4a7cbd6))


### Refactors

* clean architecture polish (i18n boundary, generics, docs) ([b553ac4](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/b553ac4fd1b23257dbc07f60679432b9ff90eea2))
* extract redirect into platform-neutral EdgeHandler + document host portability ([804df0a](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/804df0a22932a2d2bfe6d89909018acffabd7c7c))
* **motion:** polish — chrome stability, hover prefetch, cascade clarity ([5e5f13e](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/5e5f13e42571ec3f201dd676be871878b8440b64))


### Documentation

* ADR 0006 for the dropped first-paint animation + trim DS §10/change-log ([7d71035](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/7d71035a8afc50931f51bb4b5f384c0e27000ee1))
* sync all stale statements to current state ([b7d14c5](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/b7d14c5b85305e69170552d9404d5aee42b3d956))
* update Astro 5 → Astro 6 references after upgrade ([9e924ec](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/9e924ece6623a34645bace9f770c6347e414dded))


### CI / Tooling

* **deploy:** self-activating gate — skip when Cloudflare secrets are absent ([19992e3](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/19992e3ad72007807b70d71f26e77316259e04de))
* enforce Lighthouse ≥95 on perf/a11y/best-practices/SEO ([c8fb238](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/c8fb23874b8d6de84fa06bde48d4d5fd3daaf3ee))
* **lhci:** mobile preset, 5 URLs, 3 runs, Core Web Vitals + size budgets ([4569c3f](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/4569c3fad0a6ef26a7c332874c2c7551c438f491))
* parallelize lighthouse + e2e, trim runs, drop duplicate tsc, add ADRs ([75d31f5](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/75d31f57fa2ca97bea1bcffb81e0a842f9249cd6))
* production-ready workflows (SHA-pinned, cached, single pipeline) ([dd457ea](https://github.com/nicolas-bracigliano/nicolasbracigliano/commit/dd457ead52c7e7f7026049f297f69a2bd67c9480))
