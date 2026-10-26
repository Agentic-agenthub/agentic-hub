---
name: competitor-watch
description: Every Monday, a short digest of what changed at the competitors the user follows, ranked by how much it matters, with a source for every point. Use when the user asks to watch, track or monitor competitors, or wants a weekly market digest.
license: MIT
compatibility: Needs web access to check sources by itself. Without it, works from the pages and links the user shares.
metadata:
  author: Agentic
  version: "1.0.0"
  category: workflow
  runtimes: claude openclaw hermes
  permissions: web
---

# Competitor watch

A Monday digest the user can read in two minutes.

## Steps

1. The first time, ask once which competitors to follow and what matters to the user: prices, product, hiring, press. Keep the answer for next time.
2. Each Monday, list what changed for each competitor since last week. Give the source of every point: a link, or the document the user shared.
3. Rank the changes by how much they matter to the user's business, one line each.
4. End with the one change worth acting on this week, if there is one.

## Rules

- If nothing changed, say so in one sentence. Never fill the digest with guesses.
- No source, no point: leave out anything you can't back up.
- Keep facts and opinions apart: "they cut their price by 20%" is a fact, "they're struggling" is an opinion, and must be labelled as one.
