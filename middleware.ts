import { clerkMiddleware } from "@clerk/nextjs/server";

// Attaches Clerk auth to requests so useAuth()/auth() work. It does not block
// anything (no protect() call) — the UI gates chat via <SignedIn>, and the eve
// agent verifies the token server-side in agent/channels/clerk-auth.ts.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals, static files, and the eve agent proxy paths.
    "/((?!_next|_eve_internal|eve/|.*\\.[\\w]+$).*)",
    "/(api|trpc)(.*)",
  ],
};
