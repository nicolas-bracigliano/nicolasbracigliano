---
title: 'Now'
slug: 'now'
lang: en
translationKey: now
date: 2026-05-23
status: published
lede: "What's on the bench right now."
items:
  - kind: code
    where: 'on the bench · code'
    title: 'Rewriting ssg in Rust'
    prose: "The site generator that builds this page was a Node script. It still works, but I wanted to know what I didn't know — so I'm porting it. The plan: markdown parser, frontmatter, an asset hasher, a feed builder. Day three. The compiler is teaching me more than the runtime ever did."
    detail:
      - dt: 'progress'
        dd: 'parser ✓ · feed ✓ · asset pipeline (wip)'
      - dt: 'loc'
        dd: '~640 / target ~800'
      - dt: 'learned'
        dd: 'Result<T, E> as a design tool'
  - kind: guitar
    where: 'in my hands · guitar'
    title: 'Bars 9–16 of Milonga del Ángel'
    prose: "Piazzolla. I've been looping the same eight bars at half speed for three weeks. The right hand is the puzzle — the i/m alternation has to ghost the m string through the rest stroke. Slow enough and you can feel the bass note pulling the melody behind it."
    detail:
      - dt: 'target'
        dd: 'bar 9–16 clean at 88 bpm'
      - dt: 'today'
        dd: '62 bpm, looped 30 min'
      - dt: 'tomorrow'
        dd: '68 bpm, with dynamics'
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
