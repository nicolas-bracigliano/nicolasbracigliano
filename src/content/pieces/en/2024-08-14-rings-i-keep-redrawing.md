---
title: 'The rings I keep redrawing'
slug: 'rings-i-keep-redrawing'
lang: en
translationKey: clean-architecture-2024-08-14
date: 2024-08-14
written: 'Melbourne, in winter'
status: published
tags: [clean-architecture, software-design]
lede: 'Five rewrites in, the rings still want to migrate outward.'
marginNotes:
  - section: 'why-rings-not-boxes'
    text: "I keep the most recent attempt pinned above my desk. The previous four are in a notebook I don't open."
  - section: 'use-cases-versus-adapters'
    text: 'The first sign on the fintech rebuild was a unit test that needed a database connection. The rule had quietly crossed a boundary.'
  - section: 'common-mistakes-i-keep-making'
    text: 'Anemic entities are the smell of CRUD pretending to be a domain.'
diagrams:
  - key: 'clean-arch-rings'
    place: 'top'
    caption: 'Four layers, one direction. Each ring depends only on the one inside it.'
---

I've drawn these rings at least five times. Entities at the center, frameworks at the edge, arrows pointing inward. The Dependency Rule itself is right; code dependencies should flow toward the stable core. What's hard, every time, is the boundary between use cases and interface adapters. Each project teaches me a different way to draw that line.

## Why rings, not boxes

Most architecture diagrams are boxes connected by lines. The lines mean different things in different parts of the diagram (sometimes data flow, sometimes ownership, sometimes "calls"), and after a few months nobody remembers which. Rings sidestep that. The geometry says one thing: layers, with dependencies flowing one way.

You can't accidentally draw a line from the center ring to the outer ring. The shape won't let you. That's the rule made visible.

The four layers from inside out are Entities, Use Cases, Interface Adapters, and Frameworks & Drivers, names from Bob Martin's _Clean Architecture_, first sketched in his 2012 essay of the same name and expanded into the 2017 book, where the pattern got its modern shape. The labels matter less than the order; what matters is that dependencies only ever flow inward, never outward.

## The Dependency Rule

The whole architecture rests on a single rule: source code dependencies point only inward, toward higher-level policies. Entities don't know about use cases. Use cases don't know about adapters. Adapters don't know about frameworks. Each ring is ignorant of every ring outside it.

A test for whether your codebase honours this: try to take the framework out. Not "replace Express with Fastify"; take it out entirely. Run your business logic against a script, a CLI, or a test harness that doesn't import any HTTP library.

If you can do that in an afternoon, your dependencies flow inward. If it takes a week and reveals that your domain object knows about request bodies, the rule is being violated somewhere.

The first time I tried this on production code I'd written, the afternoon estimate became three weeks. I'd been smearing the framework across every layer without noticing; request validators in entities, ORM types in use cases, response shapes that leaked back into domain functions. The framework wasn't a dependency. It was a fog.

## Use cases versus adapters

The inner two rings are usually obvious. Entities are the domain objects that survive every rewrite: `Order`, `Customer`, `Position`. Use cases orchestrate them: `PlaceOrder`, `ConfirmPayment`. The outer ring is obvious too: that's whatever the runtime gives you.

The hard line is the third one, "interface adapters," and the question of what counts. A repository class? That's an adapter; it translates between domain entities and a database row. An email sender? Probably an adapter, if you're crossing a system boundary. A logger? Adapter, it crosses out of the system to the log sink.

A pricing rule with per-tenant configuration that comes from the database. That's the one I keep getting wrong.

On a fintech rebuild in 2010, years before I'd read Martin or thought in these layers; we called them "service" and "data access" at the time. I put the entire payment-gateway pricing in what I'd now call the use case layer. It worked. It also collapsed the moment we onboarded a tenant whose pricing logic differed by jurisdiction, the rule had to read from the DB to know which jurisdiction applied, which meant the use case knew about the DB schema. We'd violated the rule slowly, paragraph by paragraph, over those six months. By the time the test suite needed a real database to run, we'd already lost.

The honest heuristic: if the rule survives the database being replaced, it's an entity or use case. If it dies, it's an adapter dressed up. Most pricing rules die. Most authorisation rules survive. Most validation rules survive, until they start reading lookup tables, at which point they don't.

## Common mistakes I keep making

A few patterns I've fallen into more than once.

**Layer boundaries as module walls.** Putting each layer in its own package with hard import rules. Sometimes a function call is enough; the wall slows you down without adding safety. The boundary that matters is the _direction of dependencies_, not the namespace. A monolith with disciplined imports honours the Dependency Rule fine; a four-package project where a use case imports from the adapter layer, or worse, where an entity references HTTP request types doesn't.

**Anemic entities.** Domain objects with no behaviour, only data. `Order { id, items, total }` with `PlaceOrder` doing all the calculation. That's the use case absorbing what should belong to the entity. If your entities are getter-only, you have a CRUD app pretending to be a domain.

**Mistaking "service" for "use case."** Services often span multiple use cases ("OrderService" handles placement, refunds, cancellations, reporting). Use cases are atomic; one verb, one transaction boundary, one reason to fail. A bloated service is several use cases that didn't bother to draw their own ring.

**Pre-drawing the rings.** Sketching the architecture on a whiteboard before the first commit. The shape only shows up under the weight of real code; before that it's hope. The first version of the diagram is always wrong.

## When to reach for something else

Clean Architecture costs something. Every use case gets a class. Every aggregate gets a repository interface. Every framework concern gets an adapter. For a small CRUD app, a marketing site with a form, a personal API with two routes, a script that runs nightly; that's overhead with no payoff.

The honest threshold for reaching for layered architecture: when **two or more frameworks** are likely to touch the same domain (say, HTTP API + worker queue + scheduled job), when **the domain logic is non-trivial** (pricing, scheduling, authorisation, anything where the rules have rules), and when **the system is going to live for years**, not months.

For everything else, lighter patterns work better. Hexagonal Architecture (Alistair Cockburn's "ports and adapters") is the same idea with fewer layers and less vocabulary. Onion Architecture is the same idea again with different terms. Domain-Driven Design overlaps heavily. DDD's "domain model" and Clean Architecture's "entities" point at the same concept. For small apps, a flat Model-View-Controller with one layer of "service" functions is plenty. For prototypes, nothing, let the framework be the architecture until the prototype earns the right to a structure.

The trap is _learning Clean Architecture and applying it everywhere._ The framework punishes overuse.

## What I'd tell past me

The Dependency Rule is the load-bearing idea. The four-layer cake is a teaching aid. If your project lands on three layers, or five, or a different name for what Martin calls "adapters," that's fine. What matters is that the arrows still point inward.

The other thing I'd tell past me: don't try to draw the rings before you've shipped two versions of the thing. The shape only shows up under the weight of real code. Drawing it on a whiteboard before the first commit is a way of feeling productive without producing anything.
