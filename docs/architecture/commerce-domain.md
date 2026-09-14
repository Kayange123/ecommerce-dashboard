# Commerce Domain

## Current model

```
Store
├── Billboard   (marketing banner, used by Category)
├── Category    (belongs to one Billboard)
├── Size        (flat name/value, e.g. "Large" / "L")
└── Product
    ├── Image[]        (onDelete: Cascade with Product)
    ├── category (1)
    └── size (1)

Order
└── OrderItem → Product
```

See [prisma/schema.prisma](../../prisma/schema.prisma) for the exact
fields.

## Known gaps (tracked for v0.3, see ROADMAP.md)

- **No variants.** A product has exactly one `size` and one implicit
  "version" — there's no way to model "this t-shirt in S/M/L, each with
  its own stock." Planned: `ProductVariant`, `ProductOption`,
  `ProductOptionValue`, `SKU`.
- **No inventory.** There's no stock quantity anywhere. The webhook
  handler's current stand-in — archiving every purchased product
  regardless of how many units were bought — is not a substitute for real
  inventory tracking and produces wrong behavior the moment more than one
  unit of a product exists to sell. Planned: `InventoryItem`,
  `InventoryAdjustment`, with an explicit concurrency story (not naive
  `stock = stock - quantity`).
- **`OrderItem` has no `quantity`.** Combined with Stripe checkout
  allowing `adjustable_quantity`, this means changing quantity at checkout
  today silently produces an order whose recorded total doesn't match what
  was actually charged. This needs fixing before any inventory work, since
  inventory depends on knowing how many units were ordered.
- **No `Customer` model.** Orders aren't linked to a customer entity
  distinct from the admin `Store.userId`. Planned as part of v0.3,
  separate from Clerk-authenticated admin users.

## Money

`Product.price` is a bare `Float` with no currency field, and `USD` is
hardcoded at the point of Stripe checkout session creation. See
[multi-tenancy.md](multi-tenancy.md) for why the planned fix is integer
minor units rather than `Decimal` (MongoDB's Prisma connector doesn't
support `Decimal`). This is an RFC-worthy migration (touches every
`price` read/write across the app) — see
[docs/rfcs/README.md](../rfcs/README.md) before starting it.
