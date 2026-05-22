# 0005 — Theme state model: auto + override + silent retire

**Status**: Accepted
**Date**: 2026-05-22

## Context

We want the day/night theme to:

1. **Default to "auto"** — follow `prefers-color-scheme`, including live OS changes (macOS sunset/sunrise auto-switching).
2. **Persist explicit user choices** — the moment the user clicks the toggle, treat that as a per-device override that survives reload, navigation, and cross-tab sync.
3. **Be smart about override retirement** — if the user overrode to "noche" while the OS was "dia", and the OS later catches up to "noche", the override should _silently retire_. The next OS change is then followed automatically. Otherwise the user is "stuck" forever on a theme they once chose against a now-stale OS state.

Without rule 3: user overrides to night, OS catches up to night at sunset, OS swings back to day at sunrise — site stays on night against the OS, indefinitely.

We also want this without a tri-state toggle UI (the design system insists on a binary day/night button — no separate "auto" mode in the chrome).

## Decision

Two states, no UI footprint beyond the existing toggle:

| State             | When                                      | Behaviour                                                                                         |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **auto**          | `localStorage.theme` is unset             | `data-theme` follows `prefers-color-scheme` live. `matchMedia` change events apply the new theme. |
| **overridden(X)** | `localStorage.theme === 'dia' \| 'noche'` | `data-theme` pinned to X, ignoring OS.                                                            |

**Transitions:**

| Trigger                     | Stored state | New OS             | Action                                                                                                                          |
| --------------------------- | ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| User clicks toggle          | any          | n/a                | Set `localStorage.theme = next`. Even if `next` matches current OS — explicit click is always an explicit override.             |
| `matchMedia` change         | null (auto)  | X                  | Apply X.                                                                                                                        |
| `matchMedia` change         | X            | X (same as stored) | **Retire**: `localStorage.removeItem('theme')`. Visual no-op (theme value didn't change). Next OS change will be auto-followed. |
| `matchMedia` change         | X            | not-X              | Keep override; user wants the opposite of OS.                                                                                   |
| Sibling tab cleared storage | any          | n/a                | Re-resolve via `matchMedia`.                                                                                                    |

## Alternatives considered

| Option                                                        | Why not                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Explicit tri-state toggle (Light / Dark / Auto)**           | Adds a third UI state to a binary chrome. Design system §11 explicitly defines a binary day/night switch; growing it to tri-state adds chrome complexity disproportionate to the user value.                                                                                                                                                                          |
| **Never retire the override (current state before this ADR)** | "Stuck" UX above — user permanently fights the OS once they've ever toggled.                                                                                                                                                                                                                                                                                          |
| **Retire on click when click matches OS**                     | More aggressive: if user toggles to a theme that matches the OS, immediately retire. Means "I want today to be light" becomes "I want auto, which happens to be light today" — losing the user's expressed intent for future OS changes. The OS-catch-up rule is more conservative and matches "I clicked because I want this; if the OS catches up, fine, we agree". |
| **`localStorage.theme = 'auto' \| 'dia' \| 'noche'`**         | Three string states instead of two (string-or-null). Forces explicit "auto" representation. Cleaner code but no functional difference — null already means auto unambiguously.                                                                                                                                                                                        |

## Consequences

**What we accept:**

- A click that happens to match the current OS theme still sets the override. The retire only fires on OS _changes_, not on click. This means a user who toggles to "noche" while OS is already "noche" stays in "noche" indefinitely until the OS first changes away and then back. Documented in the state-transition table above; subtle but correct.
- One extra runtime listener (`storage` event) for cross-tab sync — about 6 lines of code. Compensates for `matchMedia` change events not propagating across tabs by themselves.

**What we gain:**

- The toggle stays binary in the chrome — design system intact.
- Auto-follow Just Works for the majority who never touch the toggle.
- Power users get explicit-override semantics with predictable retirement.
- Multi-tab users see synchronised state via `storage` events.
- No FOUC across cross-page navigation (handled by `astro:before-swap` copying `data-theme` to the incoming document — see `src/layouts/BaseLayout.astro`).

## Implementation reference

- `public/theme-init.js` — pre-paint resolution chain (localStorage → matchMedia → 'dia')
- `src/layouts/BaseLayout.astro` `<script>` block — `readStoredTheme()` / `resolveTheme()` / `applyTheme()` helpers + delegated click listener + `astro:before-swap` FOUC fix + `storage` listener + `matchMedia` change listener with retire logic

## When to revisit

- A user reports being "stuck" on the wrong theme (suggests the retire logic missed an edge case).
- We add per-user accounts/auth — at that point theme preference might move from `localStorage` to a server-side profile and the state model expands.
- Design system §11 ever permits a tri-state toggle — we could expose "auto" as a third explicit state instead of computing it from absence.
