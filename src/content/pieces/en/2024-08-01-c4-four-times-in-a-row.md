---
title: 'C4, four times in a row'
slug: 'c4-four-times-in-a-row'
lang: en
translationId: c4-diagrams-2024-08-01
date: 2024-08-01
written: 'in Melbourne, in winter'
status: published
tags: [c4-model, software-architecture, diagrams]
lede: 'Architecture diagrams that nobody asks "what does this box mean?" afterwards.'
marginNotes:
  - section: 'before-c4'
    text: 'I think we collectively wasted a generation of architects on UML.'
  - section: 'the-four-levels'
    text: "Simon Brown's docs at c4model.com are still the best reference. I keep them open in a tab."
  - section: 'when-to-stop'
    text: 'Level 4 is the one I almost never draw. The code itself is the diagram, and it stays in sync for free.'
diagrams:
  - key: 'c4-wheel'
    place: 'top'
    caption: 'Four levels of zoom. The whole system at level 1; one component at level 4.'
  - key: 'c4-context'
    place: 'bottom'
    caption: 'Level 1: System Context. The system as a single box surrounded by its users and external dependencies.'
  - key: 'c4-containers'
    place: 'bottom'
    caption: 'Level 2: Containers. The system zoomed in to show internal applications and data stores.'
  - key: 'c4-components'
    place: 'bottom'
    caption: 'Level 3: Components. One container zoomed in to show its internal components.'
  - key: 'c4-code'
    place: 'bottom'
    caption: 'Level 4: Code. One component zoomed in to show its classes. Usually optional.'
---

Architecture diagrams I drew before C4 had boxes, lines, sometimes arrows, and almost always a question afterwards about what one of the boxes meant. C4 fixes this by forcing you to commit to a zoom level, then it makes you redraw the same system one step closer, and another step closer, and another. Four times in a row feels like overkill until the third time someone asks "but where does the database fit?" and you can point at level 2 instead of redrawing.

## Before C4

The diagrams I drew at my first three jobs were UML, sort of. We had the visual vocabulary (boxes, lozenges, dashed arrows) without anyone agreeing on what each shape meant. In one project, a dashed line meant "depends on." In the next, it meant "asynchronous." In the third, it meant "I'm not sure how to represent this, please ask me."

The conversations went the same way. Someone would put a diagram on the wall, three engineers would interpret it three different ways, and the meeting would derail into "what does this box represent?" The diagram was supposed to remove ambiguity; it added some.

C4 fixes the ambiguity by being boringly explicit. Four shapes, four scopes, one direction of zoom.

## The four levels

Simon Brown developed C4 over the late 2000s and 2010s, after years of consulting work where he'd watched the same diagram-confusion play out at every client. The public reference is c4model.com; the docs are free, opinionated, and short. The names matter less than the zoom.

**Level 1 (System Context).** Your system is one box. Around it are the people who use it and the external systems it talks to. That's it. Five-minute diagram, useful for anyone non-technical in the room.

**Level 2 (Container).** Zoom in on the box. Now you see the major deployable units: web app, mobile app, API, database, message queue. Each container is a separately runnable thing. Useful for any new engineer trying to understand the shape of the system.

A C4 "Container" is not a Docker container. Simon Brown picked the word years before Docker took it over, and on c4model.com he's spent the last decade fielding the confusion. A container in C4 is anything that runs as its own process or in its own runtime: a web app, a daemon, a serverless function, a database engine. Docker is one way of packaging some of them. The terminology collision is unfortunate; the concept is older than the conflict.

**Level 3 (Component).** Zoom in on one container. Now you see the major internal modules: authentication, orders, payments, reporting. Useful when discussing where a new feature should live.

**Level 4 (Code).** Zoom in on one component. Now you see classes, interfaces, the relationships between them. Useful sometimes, often skipped. The code itself is the diagram, and it stays in sync without you having to maintain it.

The key word in all four is "useful." If the diagram isn't useful to whoever's in the room, you've drawn the wrong level.

## What C4 gets right

Three things, in order of importance:

The zoom hierarchy is explicit. When someone says "the auth component," there's no ambiguity about which level they mean. It's a Level 3 component, not a Level 2 container, not a Level 1 system. Same word, different scope, always clear from context.

The same shapes mean the same things across levels. A box is always a thing-that-runs. A line is always a relationship. A dashed line is always asynchronous. You can't accidentally introduce private vocabulary because the vocabulary is fixed.

The model knows when to stop. You don't have to draw every step. Most systems only need 1 and 2; some need 3 for one specific container; very few need 4 anywhere. The framework gives you permission to stop.

## What it doesn't fix

C4 won't tell you whether your architecture is good. It's a notation, not a design method. You can draw a perfectly C4-compliant diagram of a terrible system. The notation does its job, the system stays terrible.

It also doesn't fix the "diagram is out of date" problem. The diagrams still need maintenance; the more levels you draw, the more there is to maintain. The way to limit this is to draw the highest level you can get away with. Levels 1 and 2 change slowly. Level 3 changes when a major component splits or merges. Level 4 changes constantly and is usually wrong by the time the meeting starts.

The cheapest setup, for a system that's been running a while: keep Level 1 and Level 2 current. Skip Level 3 unless you're onboarding someone to a specific container. Skip Level 4 entirely; let the code talk.

## Common mistakes I keep making

A few I've fallen into more than once.

**Drawing all four levels by default.** Treating C4 like a checklist instead of a zoom tool. Most systems need Levels 1 and 2 only. Level 3 is a per-container decision; Level 4 is almost never worth the maintenance. Drawing four diagrams when one would do creates more to maintain and more places for them to drift apart.

**Mixing levels on one diagram.** Putting a database (Level 2 container) next to a class (Level 4 code) on the same picture. The diagram becomes unreadable because the zoom isn't consistent. C4's whole value is committing to a zoom; mixing them collapses the framework back into the boxes-and-lines mess it was supposed to fix.

**Encoding behaviour with C4.** Trying to show "user submits form, then the API does X, then Y" using C4 boxes. C4 is structural; it tells you what exists, not what happens. For behaviour, use a sequence diagram. The boxes don't sequence; they coexist.

**Letting a Level 3 diagram go stale.** A Level 3 component diagram that's six months out of date is worse than no diagram, because someone will rely on it and be wrong. The cheapest defence is to keep the diagrams at a level that doesn't change weekly. Level 3 is the one most at risk; if you can't maintain it, don't draw it.

## When this isn't the right tool

C4 is great for systems with meaningful internal structure and multiple people contributing. It's overkill, or wrong, in a few cases:

**Throwaway prototypes.** If the system might not exist in three months, don't diagram it. A one-paragraph README, or nothing, is more honest about what the code is.

**Single-process monoliths with one contributor.** The structure is "the code." A folder tree is the diagram. C4 adds notation for problems you don't have.

**Pure behavioural documentation.** State machines, request flows, scheduling logic. Use sequence diagrams or state diagrams. C4 covers what's there, not what happens.

**As a substitute for design.** C4 is for documenting an architecture that already exists, or one you've already decided on. If you're using C4 boxes to decide what to build, you're using a notation as a thinking tool, and there are better thinking tools for that: lists, prose, a whiteboard with arrows that explicitly mean nothing yet.

## When to stop

I've drawn C4 diagrams for systems where I drew all four levels and systems where I drew one. The right number is whatever answers the questions people are actually asking. If everyone keeps asking "where does the auth live," draw Level 3 for the right container. If nobody's asking, don't.

The discipline C4 gives you is not "draw four diagrams every time." It's "know which level you're at when you start drawing, and don't accidentally mix two."
