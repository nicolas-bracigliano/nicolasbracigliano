// Satori JSX template for OG cards. Used by /og/[collection]/[slug].png.ts.
// Fonts must be provided to satori; see scripts/subset-fonts.mjs for the
// one-shot dev task that produces public/fonts/og-newsreader.ttf.

export interface OgProps {
  title: string;
  lede?: string;
  locale: 'en' | 'es';
  kind: 'note' | 'work' | 'essay' | 'page';
}

export function OgCard({ title, lede, locale, kind }: OgProps) {
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
