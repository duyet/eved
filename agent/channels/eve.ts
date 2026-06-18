import { eveChannel } from "eve/channels/eve";
import { type AuthFn, ForbiddenError, localDev, none, vercelOidc } from "eve/channels/auth";
import { consume } from "../lib/rate-limit.ts";

// Rate-limit anonymous web traffic per client IP per day, enforced in the auth
// walk so it runs *before* any model work. Trusted callers (local dev, Vercel
// OIDC subagents/runtime) match the earlier entries and halt the walk, so the cap
// only ever applies to anonymous public users that fall through to none().
function dailyMessageLimit(): AuthFn<Request> {
  return async (request) => {
    // Only message-send POSTs to /eve/v1/session* carry a user message; the GET
    // stream and every other route fall through uncounted.
    if (request.method !== "POST") return null;
    if (!new URL(request.url).pathname.startsWith("/eve/v1/session")) return null;

    const ip = clientIp(request);
    if (!ip) return null; // no client IP → don't bucket every caller together

    const decision = await consume(ip);
    if (decision.limited) {
      throw new ForbiddenError({
        code: "daily_message_limit",
        message: `Daily limit of ${decision.limit} messages reached. Please come back tomorrow.`,
      });
    }
    return null; // under the cap → fall through to none()
  };
}

/** Best-effort client IP from the proxy headers Vercel sets in front of us. */
function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

export default eveChannel({
  auth: [
    // Open on localhost for `eve dev` and the REPL.
    localDev(),
    // Lets the eve TUI and Vercel deployments reach the agent.
    vercelOidc(),
    // Cap anonymous web callers per IP/day before none() lets them in — the web
    // chat runs on Duyet's model credits. See agent/lib/rate-limit.ts.
    dailyMessageLimit(),
    // Public web chat: none() accepts anyone anonymously. Must stay last so the
    // rate-limit guard above runs first. Swap in real auth (httpBasic / oidc /
    // jwt) for stronger control.
    none(),
  ],
});
