## What changed and why

<!-- Explain the reasoning, not just the diff. -->

## How to review

<!-- Call out anything specific: a tricky authorization boundary, a
     schema change, a behavior change. -->

## Testing

- [ ] `npm run format:check`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Added/updated tests for the behavior changed (required for anything
      touching authorization, payments, or data mutation — see
      [CONTRIBUTING.md](../CONTRIBUTING.md#testing-expectations))

## Database changes

- [ ] This PR does not touch `prisma/schema.prisma`
- [ ] This PR changes the schema — reasoning and migration/backfill plan
      explained above (MongoDB has no migration history — see
      [CONTRIBUTING.md](../CONTRIBUTING.md#database-migrations))
