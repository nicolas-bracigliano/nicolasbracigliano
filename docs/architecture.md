# Architecture

Read this before adding anything beyond a markdown file. It's one page on
purpose — the project is small and the structure earns its keep by being
predictable, not by being elaborate.

## Layer map

```
┌───────────────────────────────────────────────────────────────────────┐
│ src/worker.ts                Cloudflare adapter (vendor surface)      │
│    └── wraps src/lib/{pick-locale,security-txt}.ts; rest → ASSETS    │
└───────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ (depends inward only)
┌───────────────────────────────────────────────────────────────────────┐
│ src/pages/             Astro routes — orchestration, no logic         │
│ src/layouts/           Astro templates — markup + slots               │
│ src/components/        Reusable .astro snippets — mastheads, cards,   │
│                        diagrams/, art/                                │
└───────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌───────────────────────────────────────────────────────────────────────┐
│ src/lib/i18n.ts        Astro-coupled helpers (imports astro:content)  │
│    ├── entryRouteFor()       — sync, structural input                 │
│    ├── findSiblingIn()       — pure, takes a pre-loaded array         │
│    └── getSibling()          — async, calls getCollection()           │
│ src/content.config.ts  Zod schemas for the content collections        │
└───────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌───────────────────────────────────────────────────────────────────────┐
│ src/lib/routes.ts      Pure routing primitives — zero framework deps  │
│ src/lib/pick-locale.ts Pure Accept-Language picker + EdgeHandler type │
│ src/lib/security-txt.ts Host-neutral /.well-known/security.txt body   │
│ src/lib/reading-time.ts Pure markdown→minutes                         │
│ src/styles/            tokens.css, reset.css, base.css                │
└───────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ (content — the inputs)
┌───────────────────────────────────────────────────────────────────────┐
│ src/content/{notes,works,pieces,pages}/{en,es}/*.md                   │
└───────────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** arrows point inward. Outer layers depend on inner;
inner layers never know about outer. In practice:

- `src/lib/routes.ts` has zero framework imports — it runs in any JS runtime.
- `src/lib/i18n.ts` may import from `astro:content` and from `./routes`,
  but **not** from layouts or pages.
- Pages and layouts may import from `@lib/*`, but **not** from `src/worker.ts`.
- `src/worker.ts` may import from `src/lib/*` (the platform-neutral parts),
  but is the only place allowed to know about Cloudflare types.

## The adapter pattern (one place we use it)

The Cloudflare Worker at `src/worker.ts` is a small adapter that wraps
`src/lib/pick-locale.ts`'s `acceptLanguageRedirect` and serves
`/.well-known/security.txt` via `src/lib/security-txt.ts`, delegating every
other path to the Workers Static Assets binding. The redirect logic
itself is a platform-neutral `EdgeHandler`
(`(req: Request) => Response`), the same shape any modern edge runtime
speaks (Vercel Edge, Netlify Edge, Deno Deploy, Bun, and the older
Cloudflare Pages Function shape we used pre-PR-#49). To port the
redirect, write a similar adapter on the new host — the logic doesn't
move.

See `docs/security.md § Lock-in surface and escape plan` for the full
Cloudflare lock-in surface and how to leave.

## Where to put new code

| New thing                              | Goes in                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A markdown note / work / essay         | `src/content/{collection}/{lang}/*.md`                                                                                                           |
| A new bilingual route                  | mirror it in `src/pages/en/` + `src/pages/es/`; add it to `ROUTES`                                                                               |
| A schema field on existing content     | edit `src/content.config.ts`                                                                                                                     |
| A pure helper (no framework deps)      | `src/lib/*.ts` — must be unit-testable in plain Vitest                                                                                           |
| A helper that needs `astro:content`    | `src/lib/i18n.ts` (or a sibling `*.ts` next to it)                                                                                               |
| A reusable `.astro` snippet            | `src/components/` — only once it's used in 2+ places                                                                                             |
| A design token                         | `src/styles/tokens.css`                                                                                                                          |
| Per-route styling                      | `src/styles/routes/*.css`, imported from `base.css`                                                                                              |
| Cloudflare-specific code               | `src/worker.ts` — keep it adapter-thin                                                                                                           |
| Header / redirect / cache rule         | `public/_headers` or `public/_redirects` — mirror the change in `docs/security.md § Host-neutral header directives`                              |
| Build-time generated artefact          | a script in `scripts/`, wired into a `package.json` script                                                                                       |
| A consequential architectural decision | `docs/decisions/NNNN-kebab-name.md` — use the next free 0006+ number; see `docs/decisions/README.md` for the format. Append-only; never rewrite. |

## Why this works at this size

The project has six concrete responsibilities: render markdown bilingually,
pick a locale at the root, build OG cards, build a search index, ship strict
headers, and stay accessible. That's a _flat_ problem — there are no use
cases, no aggregates, no domain events to model. Adding Clean Architecture
layers (entities / use-cases / interactors / repositories) here would 10×
the line count for no behavioural win.

What we have instead is **separation by concern, layered just enough**:

- One adapter (`src/worker.ts`) keeps the one vendor-specific file isolated.
- One impure boundary (`src/lib/i18n.ts`) is the only place that talks to
  the content store; everything below it is pure and testable in milliseconds.
- The content tree is the input; the static `dist/` is the output; the
  layers between are thin and obvious.

## When to revisit this structure

Introduce new layers (a `src/services/` for server-side logic, ports + adapters
for new vendor surfaces) when **any** of these become true:

- A user-state-shaped feature lands (forms, guestbook, auth, comments).
- A second vendor surface appears (e.g. analytics SDK, queue, KV store).
- The site grows past ~3 collections and the page-file pattern starts repeating.
- A team larger than one is contributing.

Until then, the simpler structure wins — every layer you add is a layer the
next maintainer has to learn before they can ship a typo fix.
