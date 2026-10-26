---
name: inbox-zero
description: Sorts a batch of emails into reply today, reply this week, read later and archive, then drafts the replies that can't wait. Use when the user shares emails, or asks to triage, clean up or catch up on their inbox.
license: MIT
compatibility: Works with any agent that can read the emails the user shares. Never sends anything itself.
metadata:
  author: Agentic
  version: "1.0.0"
  runtimes: claude openclaw hermes
  permissions: none
---

# Inbox zero

Turn a pile of emails into four short lists and a set of ready-to-send drafts.

## Steps

1. Go through the emails the user shares with you, newest first.
2. Put each one in exactly one bucket:
   - **Reply today**: someone is waiting, or there is a deadline within 48 hours.
   - **Reply this week**: needs an answer, nothing urgent.
   - **Read later**: newsletters, reports, anything informative.
   - **Archive**: notifications, receipts, anything already handled.
3. For every email in "Reply today", draft a short reply in the user's tone. Read a few of their own sent emails first if they are available.
4. End with a three-line summary: what needs the user, what you drafted, what can wait.

## Rules

- Never send, delete or archive anything yourself: the user reviews every draft and every move.
- When you can't tell which bucket an email belongs to, put it in "Reply this week" and say why in one line.
- Quote the sender and the subject for every item, so the user can find the email.
