# Payments

## Current integration

Stripe Checkout Sessions, created by `app/api/[storeId]/checkout/route.ts`
and confirmed by `app/api/webhook/route.ts` on `checkout.session.completed`.
Payment state is a single `Order.isPaid: Boolean` — there is no
`Payment`, `PaymentAttempt`, or `Refund` model.

## Fixed since the initial audit

- **Checkout is now tenant-scoped.** Products are fetched with a
  `storeId` filter matching the URL, and the request is rejected with
  `400` if any requested product id doesn't belong to that store.
- **Webhook replay/idempotency protection.** A `ProcessedWebhookEvent`
  row, keyed by Stripe's `event.id`, is checked before and written after
  the side effects, so a Stripe retry of the same event is a no-op rather
  than re-running "mark paid + archive products."
- **Webhook signature failures return `400`** (previously `500`, which
  told Stripe's retry logic to keep resending a forged payload).
- **`OrderItem` now tracks real quantity** via `quantity` + a
  `stripeLineItemId` join key backfilled from the completed session's
  line items — see [commerce-domain.md](commerce-domain.md). Order
  totals now reflect quantity changed in Stripe's Checkout UI, not just
  "1 per line item."

## Known gaps

- **No refund tracking.** There's no way to represent a partial or full
  refund in the data model today — see ROADMAP.md v0.3.

## Where this is headed

[ROADMAP.md](../../ROADMAP.md) v0.3 adds a real `Payment`/`PaymentAttempt`/
`Refund` domain with explicit statuses (`PENDING → PROCESSING → AUTHORIZED
→ PAID → FAILED/CANCELLED → PARTIALLY_REFUNDED/REFUNDED`) and idempotency
keys. v0.4 introduces a `PaymentProvider` interface so a second provider
(M-Pesa, PayPal, ...) can be added without touching commerce logic — see
[integrations.md](integrations.md). Stripe stays the only implementation
until there's a second real one to design the interface against.
