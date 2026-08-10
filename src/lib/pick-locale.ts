// Accept-Language redirect — platform-neutral.
//
// This file is the canonical implementation. `src/worker.ts` is the
// Cloudflare Workers adapter that calls `acceptLanguageRedirect` from its
// `fetch` handler. To port the redirect to another edge runtime (Vercel
// Edge, Netlify Edge, Deno Deploy, Bun), write a similar thin adapter —
// the logic doesn't need to move.

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/** A Web Fetch handler — same shape as Cloudflare Workers, Vercel Edge,
 *  Netlify Edge, Deno Deploy, Bun, and the WHATWG `fetch` spec. */
export type EdgeHandler = (request: Request) => Response | Promise<Response>;

export interface AcceptLanguageRedirectConfig {
  /** Locales the site supports, in order of preference for tie-breaks. */
  readonly supported: readonly string[];
  /** Fallback when `Accept-Language` is absent or doesn't match anything supported. */
  readonly defaultLocale: string;
  /** HTTP status — 302 by default. Use 308 only if you're certain the redirect target won't change per-locale. */
  readonly status?: 301 | 302 | 307 | 308;
  /** Pathname this handler should treat as the root redirect. Defaults to `'/'`. */
  readonly rootPath?: string;
}

/** Parse one `Accept-Language` range into its lowercased tag and weight.
 *
 *  Splitting on a literal `';q='` (what this used to do) misses the two
 *  spellings RFC 9110 §5.6.6 permits: optional whitespace around the `;`
 *  and `=`, and a case-insensitive parameter name. Both appear in the wild,
 *  and missing them silently mangled the tag — `'es ; q=0.8'` parsed as the
 *  tag `es ; q=0.8`, which matches nothing. */
function parseRange(part: string): { tag: string; q: number } {
  const [rawTag, ...params] = part.split(';');
  const tag = (rawTag ?? '').trim().toLowerCase();
  for (const param of params) {
    const match = /^\s*q\s*=\s*(\S*)\s*$/i.exec(param);
    // Anything that isn't the weight gets skipped rather than failing the
    // range: Accept-Language defines no other parameter, so an unknown one is
    // noise from a broken client, not a reason to drop a stated preference.
    if (!match) continue;
    const q = Number.parseFloat(match[1] ?? '');
    // An unparseable or out-of-range weight is a malformed *parameter*, not a
    // malformed range: drop the weight and let the range keep the default of
    // 1. Treating it as 0 would turn a typo into a rejection, and only a
    // well-formed q=0 may reject (§12.4.2).
    return { tag, q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 1 };
  }
  return { tag, q: 1 };
}

/** The generic form of a tag: `es-AR` and `es` both match supported `es`. */
function primarySubtag(tag: string): string {
  return tag.split('-')[0] ?? '';
}

/** Pure helper. Given an Accept-Language header, return the best-matching
 *  supported locale, or `defaultLocale` if no supported locale matched.
 *
 *  q=0 means "not acceptable" (RFC 9110 §12.4.2), so a rejected range never
 *  matches — `es;q=0` returns the default rather than `es`. `*` is honoured
 *  as a fallback, never as a literal tag. */
export function pickLocale<L extends string>(
  acceptLanguage: string | null,
  supported: readonly L[],
  defaultLocale: L,
): L {
  if (!acceptLanguage) return defaultLocale;
  // `sort` is stable (ES2019+), so equal weights keep header order — that's
  // the tie-break the header itself expresses, and callers rely on it.
  const ranges = acceptLanguage
    .split(',')
    .map(parseRange)
    .sort((a, b) => b.q - a.q);

  const supportedLower = supported.map((s) => s.toLowerCase());

  // Pass 1: explicitly named tags, best weight first.
  let wildcardQ = 0;
  for (const { tag, q } of ranges) {
    if (!tag) continue;
    if (tag === '*') {
      // Deliberately not matched here even when it outranks everything else:
      // "anything" is a weaker statement than naming a tag, so `*;q=1, es;q=0.5`
      // should still yield `es`. Pass 2 picks it up if nothing explicit hits.
      wildcardQ = Math.max(wildcardQ, q);
      continue;
    }
    if (q === 0) continue; // rejected, not preferred
    const primary = primarySubtag(tag);
    if (!primary) continue;
    const idx = supportedLower.indexOf(primary);
    if (idx !== -1) return supported[idx]!;
  }

  // Pass 2: an acceptable `*` covers every tag the header didn't name, so it
  // can rescue a supported locale that pass 1 skipped. The only header shape
  // where this changes the answer is a rejected default plus a wildcard
  // (`en;q=0, *` — "not English, anything else is fine") and there the honest
  // reading is `es`, not the `en` the client just refused.
  if (wildcardQ > 0) {
    const rejected = new Set(ranges.filter((r) => r.q === 0).map((r) => primarySubtag(r.tag)));
    if (!rejected.has(defaultLocale.toLowerCase())) return defaultLocale;
    const idx = supportedLower.findIndex((s) => !rejected.has(s));
    if (idx !== -1) return supported[idx]!;
  }

  // Nothing acceptable — including the all-rejected and `*;q=0` headers. The
  // signature returns a locale and the root redirect has no 406 story, so the
  // default is the least-bad answer even when the client rejected it.
  return defaultLocale;
}

/** Build an `EdgeHandler` that 302-redirects the root path to the
 *  Accept-Language-best-match locale. Returns 404 for any other path. */
export function createAcceptLanguageRedirect(config: AcceptLanguageRedirectConfig): EdgeHandler {
  const status = config.status ?? 302;
  const rootPath = config.rootPath ?? '/';
  return (request) => {
    const url = new URL(request.url);
    if (url.pathname !== rootPath && url.pathname !== rootPath.replace(/\/$/, '')) {
      return new Response('Not found', { status: 404 });
    }
    const locale = pickLocale(
      request.headers.get('accept-language'),
      config.supported,
      config.defaultLocale,
    );
    return new Response(null, {
      status,
      headers: {
        Location: new URL(`/${locale}/`, url).toString(),
        Vary: 'Accept-Language',
        'Cache-Control': 'no-store',
      },
    });
  };
}

/** Pre-configured handler for this site (en/es, 302, root `/`). */
export const acceptLanguageRedirect: EdgeHandler = createAcceptLanguageRedirect({
  supported: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  status: 302,
});
