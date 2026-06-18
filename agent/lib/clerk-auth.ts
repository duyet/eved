import { verifyToken } from "@clerk/backend";
import { extractBearerToken, type AuthFn } from "eve/channels/auth";

// Origins where Clerk.js issues tokens (the `azp` claim verifyToken checks).
// Production is eve.duyet.net; extra origins (Vercel previews) via env, comma-separated.
const AUTHORIZED_PARTIES = [
  "https://eve.duyet.net",
  ...(process.env.CLERK_AUTHORIZED_PARTIES?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
];

/**
 * eve channel auth backed by Clerk. Verifies a `Bearer <clerk-session-token>`
 * on the request (networkless, via Clerk's JWKS) and maps the verified user to
 * an eve principal. Returns `null` when no/invalid token is present so the
 * auth walk falls through to the next entry.
 */
export function clerkAuth(): AuthFn<Request> {
  return async (request) => {
    const token = extractBearerToken(request.headers.get("authorization"));
    if (!token) return null;
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) return null;
    try {
      const payload = await verifyToken(token, { secretKey, authorizedParties: AUTHORIZED_PARTIES });
      return {
        authenticator: "clerk",
        principalType: "user",
        principalId: payload.sub,
        subject: payload.sub,
        issuer: typeof payload.iss === "string" ? payload.iss : undefined,
        attributes: { sid: typeof payload.sid === "string" ? payload.sid : "" },
      };
    } catch {
      return null;
    }
  };
}
