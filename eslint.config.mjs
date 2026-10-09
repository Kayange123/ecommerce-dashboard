import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Matches the previous .eslintrc.json's "extends": "next/core-web-vitals"
// exactly — intentionally not adding eslint-config-next/typescript here.
// That preset enables a much stricter rule set (no-explicit-any, React
// Hooks effect rules, etc.) that surfaces ~75 pre-existing findings across
// the codebase; adopting it is a deliberate, separate cleanup, not an
// incidental part of a Next.js version bump. See good-first-issues.md.
export default defineConfig([
  {
    extends: [...nextCoreWebVitals],
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
]);
