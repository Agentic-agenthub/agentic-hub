# Contributing

Anyone can propose a skill or an agent package with a pull request. Every proposal is checked automatically, then reviewed by the Agentic team before it's merged and shows up on Agentic.

## 1. Add a skill

Create `skills/<name>/SKILL.md`. The folder name and `name` must match: lowercase letters, digits and hyphens.

```markdown
---
name: meeting-prep
description: Writes a one-page brief before a meeting. Use when the user mentions an upcoming meeting and wants to prepare.
license: MIT
compatibility: Works with any agent. Better when the user shares the invite.
metadata:
  author: Your name
  version: "1.0.0"
  runtimes: claude openclaw hermes
  permissions: none
---

# Meeting prep

What the agent should do, step by step.
```

| Field | Required | Rules |
|---|---|---|
| `name` | yes | Same as the folder. 64 characters max. |
| `description` | yes | What it does **and when to use it**: agents read this to decide when to load the skill. 1024 characters max. |
| `license` | yes | One of `MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `MPL-2.0`, `CC0-1.0`, `CC-BY-4.0`. |
| `compatibility` | no | What it needs to work well. 500 characters max. |
| `metadata.author` | yes | You, or your organization. |
| `metadata.version` | yes | `"1.0.0"`, quoted. Raise it with every change. |
| `metadata.category` | no | `skill` (default), `workflow` (a routine on a schedule) or `knowledge` (answers from documents). |
| `metadata.runtimes` | yes | The engines you **tested** it on, space-separated: `claude`, `openclaw`, `hermes`. |
| `metadata.permissions` | yes | `none`, or what it needs, space-separated: `email.read` `email.send` `calendar.read` `calendar.write` `files.read` `files.write` `web` `network` `shell`. |

A skill can also hold scripts and reference files next to `SKILL.md` (text only: `.md .txt .json .yaml .yml .csv .py .sh .js .mjs .ts`). Keep `SKILL.md` under 30,000 characters and the whole folder under 300 KB.

## 2. Add an agent package

Create `agents/<name>/agent.yaml` and `agents/<name>/AGENTS.md`:

```yaml
name: inbox-assistant
title: Inbox assistant
description: Triages your email every morning and preps your meetings.
version: 1.0.0
author: Your name
license: MIT
runtime: claude            # claude, openclaw or hermes
personality:
  name: Chronos            # 30 characters max
  tone: neutral            # friendly, neutral or formal
  length: short            # short or detailed
skills:                    # skills from this registry
  - inbox-zero
permissions: []            # must include every permission its skills need
```

`AGENTS.md` holds the agent's instructions, 1000 characters max. Put the know-how in skills, not in the instructions.

## 3. Check, then open the pull request

```bash
npm ci
npm run index   # checks everything and rebuilds index.json
```

Commit `index.json` with your files, then open the pull request and fill in the checklist.

## What gets rejected

- Anything that looks like a key, a token or a password. If you published one by mistake, revoke it now: removing it from the files isn't enough.
- Invisible characters or hidden text. A reviewer must be able to read everything the agent reads.
- Scripts that reach the network without declaring `network` or `web`.
- Permissions the skill doesn't need.
- Content you don't have the right to publish, or under a license not listed above.
- Claims about an engine or a product that you haven't checked.

Warnings (a download piped into a shell, recursive deletes, base64, `sudo`…) don't block the check, but the reviewer reads each one and will ask why.

## Review

The Agentic team reviews pull requests in the order they arrive. Merged entries appear on Agentic with your name. Contributions are unpaid.
