# RFCs

An RFC is for a change big enough that reviewing the diff alone wouldn't
let a reviewer evaluate whether it's the right change — a data-model
migration, a new domain concept (organizations, inventory), a database
platform change, or anything that would be expensive to reverse.

If your change is scoped to one PR and doesn't require a decision the
maintainers haven't already made (check [ROADMAP.md](../../ROADMAP.md)
first), you probably don't need an RFC — open a PR or a regular issue
instead.

## Process

1. Copy the template below into `docs/rfcs/RFC-XXX-short-title.md`
   (sequential number, look at existing RFCs for the next one).
2. Open a PR with just the RFC file. Discussion happens on that PR (or in
   GitHub Discussions → RFCs, if enabled).
3. Once there's consensus, the RFC's `Status` changes to `Accepted` and it
   merges. Implementation happens in follow-up PRs that reference it.
4. If a later RFC supersedes an earlier one, mark the old one `Superseded
by RFC-YYY` — don't delete it; it's still useful history.

## Template

```markdown
# RFC-XXX: Title

## Status

Draft | Accepted | Superseded by RFC-YYY

## Context

What's true today, and why it's relevant.

## Problem

What can't be done today, or what's actively wrong.

## Proposed Solution

The change, concretely enough that a reviewer could estimate the work.

## Alternatives

What else was considered, and why it wasn't chosen.

## Trade-offs

What this costs — complexity, migration risk, a capability given up.

## Migration

How existing data/behavior gets from here to there. "Nothing to migrate"
is a valid answer if true — say so explicitly.

## Open Questions

What's still unresolved. It's fine to accept an RFC with open questions if
they don't block starting the work.
```

## Existing RFCs

- [RFC-001: PostgreSQL migration](RFC-001-postgresql-migration.md) — Draft.
- [RFC-002: Prisma 8 MongoDB migration](RFC-002-prisma-8-mongodb-migration.md) — Draft.
