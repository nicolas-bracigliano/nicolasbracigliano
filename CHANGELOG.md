# Changelog

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
