---
title: 'Now'
slug: 'now'
lang: en
translationId: now
date: 2026-05-23
status: published
lede: "What's on the bench right now."
# The full "on the bench" detail. Items that carry a `teaser:` block also
# appear on the home bench grid — see `benchItemsFrom()` in
# src/lib/now-items.ts (ADR 0014). now.md is the single source for both.
items:
  - kind: code
    where: 'on the bench · code'
    title: 'Rewriting my personal site in Astro'
    prose: "My last site was WordPress, built in 2022 and left alone since. It stopped looking like me a while before I admitted it. I'd been curious about [Astro] for a while, so the rebuild was the excuse to learn it. From scratch this time."
    detail:
      - dt: 'stack'
        dd: 'Astro · Cloudflare Workers'
      - dt: 'weight'
        dd: '100 Lighthouse · ~11 KB / page'
      - dt: 'learned'
        dd: 'how little JS it needs'
    teaser:
      label: 'code'
      line: 'Markdown in, Lighthouse 100 out. Day five of rewriting it in Astro, mostly to try something new.'
  - kind: guitar
    where: 'in my hands · guitar'
    title: 'A year in, playing loud'
    prose: "A year in. Open chords first, then riffs (Sunshine of Your Love, Come As You Are), and now whole songs (505, Black). Lately I'm practising standing up with the strap low. It changes the reach, and mostly it makes me want to play loud."
    detail:
      - dt: 'riffs'
        dd: 'Sunshine of Your Love · Come As You Are'
      - dt: 'songs'
        dd: '505 · Black'
      - dt: 'now'
        dd: 'learning to play standing'
    teaser:
      label: 'guitar'
      line: 'A year in: open chords, then riffs, now a couple of songs. Lately standing up, strap low.'
      guitarLabel: '· Come As You Are · 505 · Black ·'
  # - kind: garden
  #   where: 'in the huerta · garden'
  #   title: 'Spring rotation, planted out'
  #   prose: 'Black Russian, San Marzano, a punnet of Genovese basil, chamomile, two kinds of chilli. The native bees showed up two weeks earlier than last year. The borage is doing its job.'
  #   detail:
  #     - dt: 'plot'
  #       dd: '1.4 × 3 m raised'
  #     - dt: 'companions'
  #       dd: 'tom + bsl + chamomile'
  #     - dt: 'watching'
  #       dd: 'first fruit set ~5 weeks'
  #   teaser:
  #     label: 'garden'
  #     line: 'Black Russian, San Marzano, a punnet of Genovese basil, chamomile, two kinds of chilli. The native bees showed up two weeks earlier than last year.'
  #     seedlingTag: 'tomato'
  - kind: print
    where: 'in the slicer · 3D'
    title: 'Gridfinity bins for the tool drawer'
    prose: 'Custom 42 mm bins, modelled in CAD to the tool: one for the calipers, one for the nozzles, labelled bins for nuts and bolts. Six so far, more to draw. Matte PLA on the Bambu.'
    detail:
      - dt: 'grid'
        dd: '42 mm standard'
      - dt: 'filament'
        dd: 'PLA Matte · Bambu Lab P2S'
      - dt: 'so far'
        dd: '6 bespoke bins, drawer not done'
    teaser:
      label: '3d'
      line: 'Custom Gridfinity bins, modelled to the tool. Starting with the 3D-printing drawer.'
  - kind: home
    where: 'on the wall · home'
    title: 'Stone & Wood'
    prose: "The TV stand is the wrong piece of furniture for a small person who climbs. The fix isn't a different stand; it's deciding the screen is a feature of the wall, not a thing sitting on a table. A walnut shell, anchored to the studs, with the 75″ panel framed inside it instead of perched on top."
    detail:
      - dt: 'wood'
        dd: 'walnut'
      - dt: 'stone'
        dd: 'tbd'
      - dt: 'size'
        dd: '3 × 2.7 × 0.46 m'
    teaser:
      label: 'home'
      line: 'Wooden shell around the TV, with a landscape fire and a stone shelf.'
  - kind: coffee
    where: 'in the cup · coffee + mate'
    title: 'Brimstone, and La Merced'
    prose: 'Mornings: 22 g in, 38 g out, 28-30 seconds. Brimstone, CommonFolks Mornington, lots of chocolate, whilst also having some berry and stonefruit background. Around 10:30, mate. La Merced Monte, amargo. Lately the bottleneck is the machine, not the beans.'
    detail:
      - dt: 'beans'
        dd: 'Brimstone · Uganda / Kenya'
      - dt: 'mate'
        dd: 'La Merced Campo · amargo'
      - dt: 'ritual'
        dd: 'every morning · ~7:20'
  # - kind: read
  #   where: 'in the ears · reading & listening'
  #   title: 'Borges in one ear, Ousterhout in the other'
  #   prose: 'Reading A Philosophy of Software Design slowly, mostly on the tram. Borges (El jardín de senderos que se bifurcan) on audiobook while pruning. The Mom Test on Saturday afternoons, in the sun.'
  #   detail:
  #     - dt: 'paper'
  #       dd: 'Borges · El jardín…'
  #     - dt: 'audio'
  #       dd: 'Ousterhout · A Philosophy of Software Design'
  #     - dt: 'podcast'
  #       dd: 'Ezra Klein, sometimes'
---

<!--
  The /en/about/now/ page renders an inline numbered bench tour
  (see src/pages/en/about/now/index.astro); this file carries the
  six items as frontmatter so a content refresh is a markdown
  edit, not a code change. The page maps over `entry.data.items`
  through the NowItem component.
-->
