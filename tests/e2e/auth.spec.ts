import { expect, test } from "@playwright/test";

/**
 * Verifies the authentication boundary from middleware.ts, without needing
 * Clerk test credentials for the assertion itself. It still needs a real
 * `.env` (valid-format Clerk keys at minimum) for `npm run dev` to boot at
 * all — this is not yet exercised by CI, only runnable locally with a
 * populated environment.
 *
 * The full authenticated journey (login → create store → create category
 * → create product → view product → create order → view order) needs a
 * signed-in session, which requires Clerk's testing-token support
 * (@clerk/testing) and a configured Clerk test instance — tracked as a
 * good first issue (docs/contributing/good-first-issues.md #17) rather
 * than half-implemented here without a way to verify it actually works.
 */
test("unauthenticated visitors are redirected to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/sign-in/);
});
