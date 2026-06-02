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

/** Pure helper. Given an Accept-Language header, return the best-matching
 *  supported locale, or `defaultLocale` if no supported locale matched. */
export function pickLocale<L extends string>(
  acceptLanguage: string | null,
  supported: readonly L[],
  defaultLocale: L,
): L {
  if (!acceptLanguage) return defaultLocale;
  const ranges = acceptLanguage
    .split(',')
    .map((part) => part.trim())
    .map((part) => {
      const [tag, qStr] = part.split(';q=');
      const q = qStr ? Number.parseFloat(qStr) : 1;
      return { tag: (tag ?? '').toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  const supportedLower = supported.map((s) => s.toLowerCase());
  for (const { tag } of ranges) {
    if (!tag) continue;
    const primary = tag.split('-')[0];
    if (!primary) continue;
    const idx = supportedLower.indexOf(primary);
    if (idx !== -1) return supported[idx]!;
  }
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
