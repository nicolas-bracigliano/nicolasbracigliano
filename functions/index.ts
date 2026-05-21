type PagesFunction = (context: { request: Request }) => Promise<Response> | Response;

const SUPPORTED = ['en', 'es'] as const;
const DEFAULT_LOCALE = 'en';

function pickLocale(acceptLanguage: string | null): (typeof SUPPORTED)[number] {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranges = acceptLanguage
    .split(',')
    .map((p) => p.trim())
    .map((p) => {
      const [tag, qStr] = p.split(';q=');
      const q = qStr ? Number.parseFloat(qStr) : 1;
      return { tag: (tag ?? '').toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranges) {
    if (!tag) continue;
    const primary = tag.split('-')[0];
    if (primary && (SUPPORTED as readonly string[]).includes(primary)) {
      return primary as (typeof SUPPORTED)[number];
    }
  }
  return DEFAULT_LOCALE;
}

export const onRequest: PagesFunction = ({ request }) => {
  const url = new URL(request.url);
  if (url.pathname !== '/' && url.pathname !== '') {
    return new Response('Not found', { status: 404 });
  }
  const locale = pickLocale(request.headers.get('accept-language'));
  const target = new URL(`/${locale}/`, url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      Vary: 'Accept-Language',
      'Cache-Control': 'no-store',
    },
  });
};
