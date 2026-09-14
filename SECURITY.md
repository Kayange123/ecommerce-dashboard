# Security Policy

## Reporting a vulnerability

Please **do not open a public GitHub issue** for a security vulnerability.

Instead, use GitHub's private vulnerability reporting: go to the
[Security tab](https://github.com/Kayange123/ecommerce-dashboard/security)
of this repository and select "Report a vulnerability." This opens a
private advisory visible only to maintainers.

If that's not available for any reason, email the maintainer listed in
[CODEOWNERS](.github/CODEOWNERS) with:

- A description of the vulnerability and its impact.
- Steps to reproduce (a minimal PoC, if you have one).
- Any suggested fix.

We'll acknowledge reports within a few days and aim to ship a fix or
mitigation before any public disclosure. Please give us a reasonable window
to respond before disclosing publicly.

## Scope

This is a self-hosted application; there is no hosted instance run by the
maintainers. "Vulnerability" here means a flaw in the application code
itself — for example:

- Authentication or authorization bypass (e.g. one store accessing another
  store's data — see `tests/integration/*-authorization.test.ts` for the
  boundaries we actively test).
- Injection (SQL/NoSQL, command, template).
- Stripe webhook signature bypass or replay.
- Secrets leaking into logs, error responses, or client bundles.
- Dependency vulnerabilities with a realistic exploit path in this app
  (not every transitive `npm audit` finding — see
  [docs/audits/current-state.md](docs/audits/current-state.md) for how we
  triage those).

## Supported versions

This project is pre-1.0 and moving fast; security fixes land on `main`
only. There is no separate LTS branch yet.

## Our current known gaps

In the interest of not hiding known issues behind a private-disclosure
process: [docs/audits/current-state.md](docs/audits/current-state.md) is a
public, maintained audit of known architectural and security gaps (rate
limiting, webhook idempotency, etc.) that are being worked through
according to [ROADMAP.md](ROADMAP.md). If you find something not already
listed there, that's the kind of report we want.
