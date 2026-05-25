---
title: 'C4, four times in a row'
slug: 'c4-four-times-in-a-row'
lang: en
translationKey: c4-diagrams-2024-08-01
date: 2024-08-01
status: published
tags: [architecture, diagrams]
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

Architecture diagrams I drew before C4 had boxes, lines, sometimes arrows, and almost always a question afterwards about what one of the boxes meant. C4 fixes this by forcing you to commit to a zoom level, then it makes you draw the same system at the next zoom level, and the next, and the next. Four times in a row feels like overkill until the third time someone asks "but where does the database fit?" and you can point at level 2 instead of redrawing.

## Before C4

The diagrams I drew at my first three jobs were UML, sort of. We had the visual vocabulary (boxes, lozenges, dashed arrows) without anyone agreeing on what each shape meant. In one project, a dashed line meant "depends on." In the next, it meant "asynchronous." In the third, it meant "I'm not sure how to represent this, please ask me."

The conversations went the same way. Someone would put a diagram on the wall, three engineers would interpret it three different ways, and the meeting would derail into "what does this box represent?" The diagram was supposed to remove ambiguity; it added some.

C4 fixes the ambiguity by being boringly explicit. Four shapes, four scopes, one direction of zoom.

## The four levels

Simon Brown calls them Context, Container, Component, Code. The exact name isn't the point; the zoom is.

**Level 1 (System Context).** Your system is one box. Around it are the people who use it and the external systems it talks to. That's it. Five-minute diagram, useful for anyone non-technical in the room.

**Level 2 (Container).** Zoom in on the box. Now you see the major deployable units: web app, mobile app, API, database, message queue. Each container is a separately runnable thing. Useful for any new engineer trying to understand the shape of the system.

**Level 3 (Component).** Zoom in on one container. Now you see the major internal modules: authentication, orders, payments, reporting. Useful when discussing where a new feature should live.

**Level 4 (Code).** Zoom in on one component. Now you see classes, interfaces, the relationships between them. Useful sometimes, often skipped. The code itself is the diagram, and it stays in sync without you having to maintain it.

The key word in all four is "useful." If the diagram isn't useful to whoever's in the room, you've drawn the wrong level.

## What C4 gets right

Three things, in order of importance:

The zoom hierarchy is explicit. When someone says "the auth component," there's no ambiguity about which level they mean. It's a Level 3 component, not a Level 2 container, not a Level 1 system. Same word, different scope, always clear from context.

The same shapes mean the same things across levels. A box is always a thing-that-runs. A line is always a relationship. A dashed line is always asynchronous. You can't accidentally introduce private vocabulary because the vocabulary is fixed.

The model knows when to stop. You don't have to draw every level. Most systems only need 1 and 2; some need 3 for one specific container; very few need 4 anywhere. The framework gives you permission to stop.

## What it doesn't fix

C4 won't tell you whether your architecture is good. It's a notation, not a design method. You can draw a perfectly C4-compliant diagram of a terrible system. The notation does its job, the system stays terrible.

It also doesn't fix the "diagram is out of date" problem. The diagrams still need maintenance; the more levels you draw, the more there is to maintain. The way to limit this is to draw the highest level you can get away with. Levels 1 and 2 change slowly. Level 3 changes when a major component splits or merges. Level 4 changes constantly and is usually wrong by the time the meeting starts.

The cheapest setup, for a system that's been running a while: keep Level 1 and Level 2 current. Skip Level 3 unless you're onboarding someone to a specific container. Skip Level 4 entirely; let the code talk.

## When to stop

I've drawn C4 diagrams for systems where I drew all four levels and systems where I drew one. The right number is whatever answers the questions people are actually asking. If everyone keeps asking "where does the auth live," draw Level 3 for the right container. If nobody's asking, don't.

The discipline C4 gives you is not "draw four diagrams every time." It's "know which level you're at when you start drawing, and don't accidentally mix two."
