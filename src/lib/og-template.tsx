// Satori JSX template for OG cards. Used by /og/[collection]/[file].ts.
// Fonts must be provided to satori; see scripts/subset-fonts.mjs for the
// one-shot dev task that produces public/fonts/og-newsreader.ttf.

export interface OgProps {
  title: string;
  /** Callers must conditionally spread `{...(lede && { lede })}` —
   *  see BaseLayout's `description` prop for the same pattern. */
  lede?: string;
  locale: 'en' | 'es';
  kind: 'note' | 'work' | 'piece' | 'page';
}

/**
 * Minimal shape of a Satori-compatible JSX-like node. Satori's
 * TypeScript signature claims `ReactNode` from `react`, but at
 * runtime it duck-types — any object with `type` + `props` shaped
 * like JSX is accepted. We construct exactly that shape below to
 * avoid pulling React into the dependency graph for a build-time-
 * only OG image template. The cast back to React's `ReactNode`
 * lives at the single Satori boundary in the route handler.
 */
export interface SatoriElement {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: SatoriElement | string | null | Array<SatoriElement | string | null>;
  };
}

export function OgCard({ title, lede, locale, kind }: OgProps): SatoriElement {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        padding: '80px',
        background: '#f6f4ef',
        color: '#1a1814',
        fontFamily: 'Newsreader',
        justifyContent: 'space-between',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: '#8a8377' },
            children: `${kind} · ${locale}`,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 20 },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: 72, lineHeight: 1.1, fontWeight: 500 },
                  children: title,
                },
              },
              lede
                ? {
                    type: 'div',
                    props: {
                      style: { fontSize: 28, color: '#3e3a34', fontStyle: 'italic' },
                      children: lede,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: 20, color: '#8a8377', letterSpacing: 2 },
            children: 'nicolasbracigliano.com',
          },
        },
      ],
    },
  };
}
