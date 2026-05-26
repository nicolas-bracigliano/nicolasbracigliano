---
title: 'Where agile keeps getting stuck'
slug: 'where-agile-gets-stuck'
lang: en
translationKey: agile-stuck-2023-06-18
date: 2023-06-18
written: 'Melbourne, AU'
status: published
tags: [agile, scrum, teamwork]
lede: 'The standups drift. The retros get cut. The pattern isn’t agile failing.'
marginNotes:
  - section: 'the-standup-drift'
    text: 'If your standup is for your manager, your manager is doing the standup.'
  - section: 'what-gets-cut-first'
    text: "I've never seen a team cut their planning meeting. Always the retro."
  - section: 'common-mistakes-i-keep-making'
    text: "Scrum is a flavour of agile. 'We don't do agile' usually means 'we don't do Scrum.' Worth checking which one is being said."
diagrams:
  - key: 'agile-road-knot'
    place: 'top'
    caption: 'Where it usually starts on the left; where it should land on the right. The middle is where most teams stop.'
---

At three of the last four jobs I've held, agile was the way we said we worked. At all four, the daily standup had drifted into a status meeting for managers within six months. The pattern isn't that agile doesn't work. It's that the parts that take patience (retros, a real Scrum Master, refusing to fill the sprint to 100%) are the first things cut when the team is under pressure.

## The standup drift

The drift always looks the same. Week one, the standup is fast: three questions, fifteen minutes, the team unblocks itself. Month three, the standup is a check-in: each person reports up the chain, the manager listens, the team is silent except when spoken to. Same meeting, completely different function.

The mechanism is simple. Pressure builds, someone above the team needs visibility, the standup is the most convenient surface to extract it from. Once the meeting starts answering "what did each person do yesterday" instead of "what's blocking us today," it has become a status meeting. The label on the calendar invite is the only thing that hasn't changed.

If your standup is for your manager, your manager is doing the standup. That's a status meeting. Status meetings are fine, but they shouldn't be daily, and they shouldn't pretend to be agile ceremonies.

## What the Scrum Master role actually does

Every team I've worked on that had a real Scrum Master had one specific person whose job was to notice the drift before anyone else did. Not a developer who also ran ceremonies. Not the manager wearing two hats. A separate role.

What that person did, concretely: said "I noticed the last three standups were about reporting upward, not unblocking. Let's go back to the three questions." Or: "We've skipped the retro twice in a row. We're skipping it again next week and I'll be naming it as a pattern." Or: "The sprint is 130% full. Either three things come out or we agree right now that two of them will roll."

These interventions look small. They're not. The reason the Scrum Master role exists is that everyone else on the team has a stake in the work continuing; the Scrum Master has a stake in the team continuing to work well. Those overlap most of the time and diverge under pressure.

Teams that don't have someone in this role aren't immediately worse. They're worse on the third month, the sixth month, the second project. The drift compounds.

## What gets cut first

There's a predictable order. The retro goes first. It's the only ceremony with no immediate output and the most discomfort. Skipping it once is fine; twice is a pattern; four times is a culture.

Planning gets cut next, but more subtly. The meeting still happens, but it shortens from "what's possible in two weeks" to "what does the backlog say next." The conversation about capacity stops happening.

Then padding goes. Sprints fill to 100% of capacity, then 110%, then 130% with the assumption that "we'll catch up." The team catches up by working late, then by cutting corners, then by introducing the kind of bugs that make the next sprint worse.

Standups become status meetings, retros stop happening, planning becomes backlog-flushing, capacity inflates. None of these are agile failing. They're agile being eroded by pressure, one ceremony at a time.

## Common mistakes I keep making

A few patterns I've fallen into, or watched teams I was on fall into, more than once.

**Treating Scrum and agile as the same thing.** Scrum is one specific framework: three roles, four ceremonies, three artefacts. Agile is older and broader; it's the values and principles of the manifesto, plus a wider set of practices that may or may not include Scrum. "We don't do agile here" usually means "we don't do Scrum." That's a different claim, and the conversation that follows is different. Worth checking which one is being said.

**Velocity as a target.** Velocity is a description of how much the team got done last sprint. Useful for planning the next one. The moment it becomes a target ("the team needs to hit 40 points this sprint"), Goodhart's law kicks in: any measure that becomes a target stops being a good measure. The points get inflated, the planning value collapses, and the number stops telling you anything about reality. Velocity is a measurement, not a quota.

**Treating the sprint commitment as a contract.** The sprint goal is a forecast under uncertainty. If something urgent shows up mid-sprint, the right move is to renegotiate, not to silently absorb the new work and miss the original commitment. Teams that treat the commitment as a contract end up either lying about completion or working overtime to avoid lying. Renegotiating is the cheap version of the same conversation.

**Doing the ceremonies as theatre.** Going through the motions of planning, standup, review, retro because the framework says so, without the conversations the ceremonies were designed to surface. The check is whether the ceremony actually changes something the team does next. If the retro never produces a behavioural change, the retro has become theatre. The fix is rarely "more ceremonies"; usually it's "fewer, and actually do the thing."

## When this isn't the right tool

Scrum-style agile fits stable cross-functional teams doing incremental product development with a clear product owner. It fits worse in a few cases:

**Solo work.** If you're one person, ceremonies designed for a team of five are overhead. Use the parts you find useful (a backlog, maybe a weekly retro with yourself) and skip the rest. The framework doesn't earn its weight at team size one.

**Pure research or R&D.** Scrum assumes work can be split into sprintable chunks with deliverable outcomes. Research doesn't fit that shape; a sprint might end in "we learned X doesn't work, here's the next thing to try." That's a fine outcome for research and a confusing one for Scrum reporting. Different framing helps: timeboxes around questions, not around deliverables.

**Fixed-scope, fixed-deadline contracts.** Agile's premise is that scope and priorities can move under new information. Contracts that lock both leave nothing for the team to negotiate. The work can still be incremental and iterative; calling that Scrum doesn't change the constraint, and pretending otherwise wastes everyone's time at the next planning meeting.

**Teams with churn.** Scrum compounds value over months: the retro feeds the next retro, the team learns its own velocity, the same Scrum Master notices the same drifts and gets faster at catching them. A team that turns over every six weeks doesn't compound. The ceremonies still happen, but the institutional memory the retro builds on doesn't survive the turnover. Different problem; different tools.

## What I'd protect

The retro, always. It's the only ceremony whose explicit job is improving the team's ability to do the next sprint. Cut every other ceremony before cutting it.

The Scrum Master role, if you can have it. If you can't have a dedicated one, rotate the role weekly so someone always has the explicit responsibility to notice drift. Not "everyone owns it." Specifically rotated, this week.

The capacity number. Refusing to fill a sprint to 100% feels like leaving value on the table. It isn't. The 30% you leave empty is what absorbs the inevitable surprise. Teams that consistently sprint at 100% are teams that consistently fail sprints.

I think agile works. I just rarely see it stay alive under pressure. The version that survives is the version where someone has decided which parts are non-negotiable, and protects them when everyone else is reaching for the cuts.
