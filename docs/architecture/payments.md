# Payments

## Current integration

Stripe Checkout Sessions, created by `app/api/[storeId]/checkout/route.ts`
and confirmed by `app/api/webhook/route.ts` on `checkout.session.completed`.
Payment state is a single `Order.isPaid: Boolean` — there is no
`Payment`, `PaymentAttempt`, or `Refund` model.

## Known gaps

- **No tenant scoping at checkout.** The checkout route fetches products
  by id only, with no `storeId` filter, then writes `storeId:
params.storeId` onto the created order regardless of which store the
  products actually belong to. See
  [docs/audits/current-state.md](../audits/current-state.md) architecture
  issue #6.
- **No webhook replay/idempotency protection.** No `event.id` is
  persisted or checked, so a Stripe retry (which Stripe does on a slow or
  failed response) can re-run the "mark paid + archive products" side
  effects more than once.
- **Webhook signature failures now return `400`** (fixed — previously
  `500`, which told Stripe's retry logic to keep resending a forged
  payload).
- **No refund tracking.** There's no way to represent a partial or full
  refund in the data model today.
- **`OrderItem` has no quantity** — see
  [commerce-domain.md](commerce-domain.md); this means order totals are
  already wrong today whenever a Stripe checkout quantity is changed from
  1, independent of anything payment-specific.

## Where this is headed

[ROADMAP.md](../../ROADMAP.md) v0.3 adds a real `Payment`/`PaymentAttempt`/
`Refund` domain with explicit statuses (`PENDING → PROCESSING → AUTHORIZED
→ PAID → FAILED/CANCELLED → PARTIALLY_REFUNDED/REFUNDED`) and idempotency
keys. v0.4 introduces a `PaymentProvider` interface so a second provider
(M-Pesa, PayPal, ...) can be added without touching commerce logic — see
[integrations.md](integrations.md). Stripe stays the only implementation
until there's a second real one to design the interface against.
