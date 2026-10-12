---
name: Refund requests
description: Handle a customer's refund request from the support desk. Find the order, check what was paid, refunded and shipped against the store's own policy, then propose the refund or the return and the reply.
---

# Handling a refund request

Use this when a support ticket asks for money back, an exchange or a return. The decision follows the store's
own policy and the order's own records. Never promise a refund, an amount or a date before the tool that makes
it has answered.

## 1. Read the request

- Read the ticket and its whole thread (`support_tickets_get`, `support_ticket_messages_list`). Note who asks,
  what they ask for (a full refund, part of an order, an exchange, a stopped subscription) and why.
- Note what the customer gives you: an order number, a tracking number, a description or photos of damage.

## 2. Find the order

- Find the order by the number the customer gave, or search the order list for the customer's orders
  (`orders_list`). When more than one order could match, name them in an internal note and ask the person
  which one.
- Read it (`orders_get`) and check that it belongs to the customer on the ticket. If it does not, stop and say so.

## 3. Check what happened to it

- **Paid**: its transactions (`orders_list_transactions`): what was captured, when, and by which method.
- **Already refunded**: its refunds (`orders_list_refunds`). Never refund more than was captured, less what was
  refunded already.
- **Shipped**: its fulfilments and tracking (`orders_list_fulfillments`, `orders_query_tracking`). Not shipped yet,
  in transit and delivered are different cases.
- **Returned**: its returns (`orders_list_returns`). An open return decides what comes next.

## 4. Find the store's policy

Look for the store's refund and return policy in its FAQs (`support_faqs_list`) and canned replies
(`support_canned_replies_list`), and quote the rule you apply. When you find none, do not invent one: describe
the case to the person and ask how they want it handled.

## 5. Propose the outcome

Choose one, and say why, citing the policy and the order's records:

- **Cancel before it ships**: the order has not left the warehouse, so cancelling it, or the lines asked about,
  is the refund (`orders_cancel`, `orders_cancel_line_items`).
- **Return first**: the policy asks for the item back. Open the return (`orders_returns_open`) and refund when it
  arrives.
- **Refund now**, in full or in part (`orders_refund`): the amount comes from the order's own lines and totals, in
  its own currency.
- **Decline**: the request is outside the policy (too late, a final-sale item). Say which rule applies.
- **Escalate** (`support_tickets_escalate`): anything the policy and the records do not settle, such as a
  chargeback, a suspected fraud, or an amount beyond what the policy allows.

A refund, a cancellation and a return change the customer's money or order, and may wait for a person's
approval. Propose each once, with the amount and the reason, and wait; never repeat a call while it waits.

## 6. Reply and record

- Write the reply to the customer and send it with `support_replies_send`, which may wait for approval: what was
  decided, the amount and how it reaches them, and what happens next. Promise only what a tool has done or the
  person has approved. Start from a canned reply when one fits.
- Add an internal note (`support_tickets_add_note`) with the evidence: the order, the policy rule, the amounts
  captured and refunded, and the shipping state.
- Set the ticket's status to what is left (`support_tickets_set_status`): waiting for the return, waiting for
  approval, or solved.

## Rules

- Stop a subscription only when the customer asks for that, as its own step (`orders_cancel_membership`).
- Never change an order the customer did not ask about.
- When a tool refuses, read why, fix what you can, and tell the person plainly what you could not do.
