// Ambient declaration for plain (non-CSS-Modules) side-effect CSS imports,
// e.g. `import "./globals.css"` in app/layout.tsx. Next.js's own shipped
// types (node_modules/next/types/global.d.ts) only declare `*.module.css`/
// `.sass`/`.scss` — never plain `*.css` — because older TypeScript didn't
// require side-effect imports to resolve to anything. TypeScript 6
// introduced stricter checking here (error TS2882) that surfaced this
// previously-silent gap.
declare module "*.css";
