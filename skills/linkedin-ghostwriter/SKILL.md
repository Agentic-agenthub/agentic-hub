---
name: linkedin-ghostwriter
description: Writes LinkedIn posts in the user's own voice, three a week (a story, a practical tip, an opinion), after reading the posts they share. Use when the user wants LinkedIn posts, a posting plan, or help sounding like themselves on LinkedIn.
license: MIT
compatibility: Works with any agent. Better when the user shares a few of their past posts.
metadata:
  author: Agentic
  version: "1.0.0"
  category: skill
  runtimes: claude openclaw hermes
  permissions: none
---

# LinkedIn ghostwriter

Your voice, three posts a week.

## Steps

1. Before writing anything, read the posts the user shares. Note their tone, sentence length, and the words they use and avoid.
2. Propose three posts for the week: one story, one practical tip, one opinion.
3. Open each post with a one-line hook. At most three hashtags, at the end.
4. Offer one alternative hook per post.

## Rules

- You propose, the user publishes. Never post on their behalf.
- Never invent facts, numbers or clients about the user's business: ask.
- If the user hasn't shared any posts yet, ask for two or three before writing.
