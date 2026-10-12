---
name: commit
description: Commit working-tree changes in this repo — always on a dedicated branch, as fine-grained Conventional Commits, each tied to a GitHub issue (found or created), then push and open a PR. Use when the user asks to commit, make a commit, or save/ship work.
argument-hint: "[optional hint for the commit message or which files to include]"
---

# Commit

Commit work in `ecommerce-dashboard` the way this repo's history does it,
and follow these standing maintainer rules every time:

1. **Always a separate branch.** Never commit on `main` or `develop`.
2. **Fine-grained Conventional Commits.** One logical change per
   commit.
3. **Every commit refers to an issue.** Find the existing issue or
   create one.
4. **Always finish with a PR.** Hand off to the push workflow
   (`.claude/skills/push/SKILL.md`) once the commits are made.

## 1. Look before committing

Run these in parallel and read the output:

```bash
git status --short
git diff --stat
git branch --show-current
git log --oneline -5
```

- **Never stage** `.env*`, `*.pem`, `.claude/settings.local.json`,
  `tsconfig.tsbuildinfo`, `next-env.d.ts`, `.next/`, `coverage/`,
  `playwright-report/`, or `test-results/`. Stage by explicit path
  (`git add <paths>`), not `git add -A` / `git add .`.
- **Scan the diff for secrets** (Clerk/Stripe/Cloudinary keys, webhook
  secrets, `sk_live_`, `sk_test_`, `whsec_`). If you find one, stop and
  tell the user. Don't commit it, even to a branch.

## 2. Plan the commits

Read the full diff and break it into the smallest changes that each make
sense on their own:

- **One commit = one logical change.** Usually that's one bug fix or one
  feature step, together with its tests and its CHANGELOG bullet.
  Prerequisites that stand on their own get their own commit before
  the change that needs them. For example, a test-helper extension
  becomes `test: ...`, and a new shared module becomes `feat: ...`.
- **Every commit must pass the gate on its own** (step 5). Order commits
  so each one builds on the previous one without forward references.
- **When one file holds several concerns**, don't commit the file whole.
  Rebuild it one concern at a time: save the final versions of the
  files to the scratchpad, `git checkout -- <files>`, re-apply one
  concern, commit, and repeat. After the last commit, `diff` the tree
  against the saved finals to prove nothing was lost or changed.
  (`git add -p` isn't available because interactive git is unsupported.)
- **Group commits into branches by area.** Related commits (say, all
  checkout fixes) share one branch and one PR. Unrelated work
  (product fixes vs. tooling docs) goes on separate branches with
  separate PRs.

Show the user the planned commit list (subject, issue, files) before
committing when the split is non-obvious.

## 3. Find or create the issue for each commit

Search before creating, so issues aren't duplicated:

```bash
gh issue list --state all --search "<keywords>" --limit 10
```

- If an issue already covers the change, use it.
- Otherwise create one. Write it as a bug report or feature request,
  not as a description of the fix: what's wrong, its impact, where it
  is, and how to reproduce it.

  ```bash
  gh issue create --title "<plain-language problem>" \
    --label bug --body-file <scratch file>
  ```

  Labels in use: `bug`, `enhancement`, `documentation`, `dependencies`,
  `good first issue`.

- One issue per problem. Several commits can refer to one issue, such as
  a prerequisite and the fix that uses it.
- **Security vulnerabilities never get a public issue.** SECURITY.md
  forbids it, and the repo is public. Track them in a private
  repository security advisory instead:

  ```bash
  gh api -X POST repos/Kayange123/ecommerce-dashboard/security-advisories \
    -f summary="..." -f description="..." \
    -F 'vulnerabilities[][package][ecosystem]=npm' \
    -F 'vulnerabilities[][package][name]=ecommerce-dashboard'
  ```

  Refer to it by its `GHSA-…` id. Keep the commit and PR wording to the
  fix and its test, without an exploit walkthrough. If the advisory
  can't be created, stop and ask the user rather than falling back to a
  public issue.

## 4. Branch

If you're on `main`, on `develop`, or on a branch that belongs to other
work, create a branch from up-to-date `develop`:

```bash
git fetch origin
git checkout -b <type>/<issue-number>-<short-description> origin/develop
```

For example, `fix/52-stripe-integer-amount` or `docs/58-commit-push-skills`.
If the branch covers several issues, use the lowest issue number plus an
area name, such as `fix/52-checkout`. To carry uncommitted work onto the
new branch, create the branch from the current `HEAD` instead.

## 5. Run the gate for every commit

Before each commit:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test
```

- If `format:check` fails, run `npx prettier --write <changed files>`.
  Prettier is the formatting authority, so don't hand-format against it.
- If anything else fails, fix it or report the failure with its output.
  Don't commit red, and don't use `--no-verify`.
- Before handing off to the PR, also run `npm run build`. It needs a
  placeholder Clerk key:
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZmFrZS1rZXktZm9yLWJ1aWxkLnRlc3QuY2xlcmsuYWNjb3VudHMuZGV2JA npm run build`
  (the same non-secret placeholder CI uses).

Repo rules that block a commit (from AGENTS.md):

- New behavior needs a test, in the same commit as the behavior. Anything
  touching authorization needs a test proving the **cross-store negative
  case** (`tests/integration/*-authorization.test.ts`).
- A change to `prisma/schema.prisma` must not be committed unless the
  task explicitly asked for a schema change. If it did, the commit body
  states the reasoning and any backfill.
- No new `console.log` in app code.

## 6. CHANGELOG

Every user-visible change (fix, feature, security, behavior change,
dependency bump) adds a bullet under `## [Unreleased]` in `CHANGELOG.md`.
The bullet goes **in the same commit as the change**. Use the existing
subsection (`### Security`, `### Changed`, `### Added`, `### Fixed`), and
don't create a duplicate heading. Explain the impact, not just the file.

Don't edit `docs/audits/*.md` to reflect a fix. Audits are historical
snapshots.

Skip the CHANGELOG for pure refactors, test-only, and CI-only changes.

## 7. Write the message

Format, matching `git log`:

```
<type>(<optional scope>): <imperative summary, lowercase, no period>

<body: why this change exists — the bug and its consequence, or the
need — then anything non-obvious about how. Wrap at ~72 columns.>

Refs #<issue>
```

- **Types:** `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`,
  `perf`, `revert`. Dependency bumps are `chore(deps): ...`.
- **Scopes in use:** `ui`, `security`, `test`, `deps`, or the area
  (`checkout`, `webhook`, `products`, `orders`, `dashboard`, `api`,
  `skills`). Omit the scope if none fits.
- Keep the subject at 72 characters or fewer.
- The body is required for anything but trivial changes. It explains
  _why_. See `git log -5 --format=%B` for the expected depth.
- The footer is `Refs #N` (or `Refs GHSA-…`). `Closes #N` belongs in the
  PR body instead, so issues close when the PR merges rather than when a
  commit lands on a branch.
- Append any attribution trailer your environment requires after the
  issue footer.

Commit with a heredoc so the formatting survives:

```bash
git commit -F - <<'EOF'
fix(checkout): send Stripe an integer amount in minor units

Number(price) * 100 produces floats like 1998.9999999999998 for 19.99,
which Stripe rejects as a non-integer unit_amount...

Refs #52
EOF
```

## 8. Open the PR

Once the branch's commits are done and the build passes, follow
`.claude/skills/push/SKILL.md` to push the branch and open the PR. Do
this for each branch you created. Then report each PR URL with its
commits and the issues it closes.
