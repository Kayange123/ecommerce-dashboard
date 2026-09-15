import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// authMiddleware (v4) was removed in Clerk v6 in favor of clerkMiddleware,
// which protects nothing by default — unlike v4, where every route was
// protected except publicRoutes. This isPublicRoute matcher intentionally
// reproduces the old publicRoutes: ["/api/:path*"] behavior: /api/* stays
// unenforced by Clerk (every route handler already hand-checks auth()
// itself — see docs/architecture/authentication.md), sign-in/up stay
// reachable while signed out, and everything else requires a session.
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
