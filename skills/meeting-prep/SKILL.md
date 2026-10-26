---
name: meeting-prep
description: Writes a one-page brief before a meeting, with the goal, the attendees, the open questions and the decision to get. Use when the user mentions an upcoming meeting, call or interview and wants to prepare.
license: MIT
compatibility: Works with any agent. Better when the user shares the invite and past notes.
metadata:
  author: Agentic
  version: "1.0.0"
  runtimes: claude openclaw hermes
  permissions: none
---

# Meeting prep

A one-page brief the user can read in two minutes before walking in.

## Steps

1. Ask for what you don't have yet: the invite, the attendees, and any notes or past emails about the topic. Ask once, in a single message.
2. Write the brief, in this order:
   - **Goal**: what the meeting is for, in one sentence.
   - **Who attends**: one line per person, with what they care about.
   - **Where things stand**: the facts that matter, three to five bullet points.
   - **Open questions**: what is still unclear.
   - **Decision to get**: what the user should leave the meeting with.
3. End with three questions the user could ask.

## Rules

- Keep it to one page. Cut anything the user won't need in the room.
- Say where each fact comes from (the invite, a note, an email). Never guess what an attendee thinks.
