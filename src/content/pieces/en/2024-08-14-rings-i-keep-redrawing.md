---
title: 'The rings I keep redrawing'
slug: 'rings-i-keep-redrawing'
lang: en
translationKey: clean-architecture-2024-08-14
date: 2024-08-14
status: published
tags: [architecture, code]
lede: 'Five rewrites in, the rings still want to migrate outward.'
marginNotes:
  - section: 'why-rings-not-boxes'
    text: "I keep the most recent attempt pinned above my desk. The previous four are in a notebook I don't open."
  - section: 'use-cases-versus-adapters'
    text: 'On a fintech rebuild in 2022 I put the entire payment gateway in "use case" for six months. It worked. It was also wrong.'
diagrams:
  - key: 'clean-arch-rings'
    place: 'top'
    caption: 'Four layers, one direction. Each ring depends only on the one inside it.'
---

I've drawn these rings at least five times. Entities at the center, frameworks at the edge, arrows pointing inward. The Dependency Rule itself is right; code dependencies should flow toward the stable core. What's hard, every time, is the boundary between use cases and interface adapters. Each project teaches me a different way to draw that line.

## Why rings, not boxes

Most architecture diagrams are boxes connected by lines. The lines mean different things in different parts of the diagram (sometimes data flow, sometimes ownership, sometimes "calls"), and after a few months nobody remembers which. Rings sidestep that. The geometry says one thing: layers, with dependencies flowing one way.

You can't accidentally draw a line from the center ring to the outer ring. The shape won't let you. That's the rule made visible.

## What the Dependency Rule prevents

A test for whether your architecture has a Dependency Rule problem: try to take the framework out. Not "replace Express with Fastify"; take it out entirely. Run your business logic against a script, a CLI, or a test harness that doesn't import any HTTP library.

If you can do that in an afternoon, your dependencies flow inward. If it takes a week and reveals that your domain object knows about request bodies, the rule is being violated somewhere.

The first time I tried this on production code I'd written, the afternoon estimate became three weeks. I'd been smearing the framework across every layer without noticing.

## Use cases versus adapters

The inner two rings (entities, use cases) are usually obvious. The outer ring (frameworks) is obvious too: that's whatever the runtime gives you. The hard line is the third one, "interface adapters," and the question of what counts.

A repository class. That's an adapter; it translates between domain entities and a database row.

An email sender. Probably an adapter, if you're crossing a system boundary.

A pricing rule with per-tenant configuration that comes from the database. That's the one I keep getting wrong. Half my projects put it in "use case." The other half put it in "adapter." Neither feels right.

The honest answer, I think, is: if the rule survives the database being replaced, it's an entity or use case. If it dies, it's an adapter dressed up. Most pricing rules die.

## What I'd tell past me

The Dependency Rule is the load-bearing idea. The four-layer cake is a teaching aid. If your project lands on three layers, or five, or a different name for what Martin calls "adapters," that's fine. What matters is that the arrows still point inward.

The other thing I'd tell past me: don't try to draw the rings before you've shipped two versions of the thing. The shape only shows up under the weight of real code. Drawing it on a whiteboard before the first commit is a way of feeling productive without producing anything.
