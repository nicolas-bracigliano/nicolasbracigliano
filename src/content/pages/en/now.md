---
title: 'Now'
slug: 'now'
lang: en
translationId: now
date: 2026-05-23
status: published
lede: "What's on the bench right now."
# The full "on the bench" detail. The home page (src/content/pages/en/home.md)
# shows a 4-card teaser of these same subjects — keep the two in sync.
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
    title: 'Learning the basics'
    prose: "Piazzolla. I've been looping the same eight bars at half speed for three weeks. The right hand is the puzzle — the i/m alternation has to ghost the m string through the rest stroke. Slow enough and you can feel the bass note pulling the melody behind it."
    detail:
      - dt: 'Chords'
        dd: 'D · A · E · Am · Em · Dm · G · C'
      - dt: 'target'
        dd: 'fast and accurate chord changes'
      - dt: 'today'
        dd: '~55 changes per minute, losing accuracy by the end'
    teaser:
      label: 'guitar'
      line: 'Training left and right hand, learning the eight essential chords, bonding with the instrument.'
      guitarLabel: '· D · A · E · Am · Em · Dm · G · C ·'
  - kind: garden
    where: 'in the huerta · garden'
    title: 'Spring rotation, planted out'
    prose: 'Black Russian, San Marzano, a punnet of Genovese basil, chamomile, two kinds of chilli. The native bees showed up two weeks earlier than last year. The borage is doing its job.'
    detail:
      - dt: 'plot'
        dd: '1.4 × 3 m raised'
      - dt: 'companions'
        dd: 'tom + bsl + chamomile'
      - dt: 'watching'
        dd: 'first fruit set ~5 weeks'
    teaser:
      label: 'garden'
      line: 'Black Russian, San Marzano, a punnet of Genovese basil, chamomile, two kinds of chilli. The native bees showed up two weeks earlier than last year.'
      seedlingTag: 'tomato'
  - kind: print
    where: 'in the slicer · 3D'
    title: 'Catch-all tray, rev 5'
    prose: "Five iterations to fit the espresso tamper. Magnets in the corners; the slot finally fits without play. The fillets are too aggressive — I'll soften them in rev 6."
    detail:
      - dt: 'material'
        dd: 'PETG, recycled'
      - dt: 'layer'
        dd: '0.16 mm · 4 walls'
      - dt: 'next'
        dd: 'rev 6: softer fillets'
    teaser:
      label: '3d'
      line: 'Five iterations to fit the espresso tamper. Magnets in the corners; the slot finally fits without play.'
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
    title: 'Padre Ethiopia, and Cruz de Malta'
    prose: 'Mornings: 20 g in, 38 g out, 28 seconds. Padre Coffee, Brunswick — a washed Ethiopia, bright and floral. Around 10:30, mate. Cruz de Malta, amargo, with hot water from the kettle on the same burner as everything else.'
    detail:
      - dt: 'beans'
        dd: 'Padre Coffee, washed Ethiopia'
      - dt: 'mate'
        dd: 'Cruz de Malta · amargo'
      - dt: 'ritual'
        dd: 'every morning · ~7:20'
  - kind: read
    where: 'in the ears · reading & listening'
    title: 'Borges in one ear, Ousterhout in the other'
    prose: 'Reading A Philosophy of Software Design slowly, mostly on the tram. Borges (El jardín de senderos que se bifurcan) on audiobook while pruning. The Mom Test on Saturday afternoons, in the sun.'
    detail:
      - dt: 'paper'
        dd: 'Borges · El jardín…'
      - dt: 'audio'
        dd: 'Ousterhout · A Philosophy of Software Design'
      - dt: 'podcast'
        dd: 'Ezra Klein, sometimes'
---

<!--
  The /en/about/now/ page renders an inline numbered bench tour
  (see src/pages/en/about/now/index.astro); this file carries the
  six items as frontmatter so a content refresh is a markdown
  edit, not a code change. The page maps over `entry.data.items`
  through the NowItem component.
-->
