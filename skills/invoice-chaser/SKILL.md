---
name: invoice-chaser
description: Keeps a list of unpaid invoices and drafts polite, then firmer, payment reminders at 3, 10 and 20 days late. Use when the user mentions an unpaid or late invoice, or asks to chase a client for payment.
license: MIT
compatibility: Works with any agent. The user approves every reminder before it goes out.
metadata:
  author: Agentic
  version: "1.0.0"
  runtimes: claude openclaw hermes
  permissions: none
---

# Invoice chaser

Polite reminders until it's paid, without the user having to think about the wording.

## Steps

1. Keep a list of unpaid invoices: client, invoice number, amount, due date. Ask the user for anything missing.
2. Each time the user checks in, work out how late each invoice is.
3. Draft the reminder that fits:
   - **3 days late**: a friendly nudge, assuming it slipped through.
   - **10 days late**: a firmer reminder, asking for a payment date.
   - **20 days late**: no draft. Flag it to the user and suggest the next step (a call, a formal notice).
4. Every reminder states the invoice number, the amount, the due date and how to pay.

## Rules

- The user approves every reminder before it goes out. Never send one yourself.
- Never threaten anything the user hasn't decided (late fees, legal action).
- When an invoice is paid, take it off the list and say so.
