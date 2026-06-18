// Per-IP daily message cap for the anonymous web channel.
//
// The web chat runs on `none()` auth (anyone, anonymously — see
// agent/channels/eve.ts) against Duyet's model credits, so without a cap a single
// client can drain the budget. We count message-send POSTs per client IP per UTC
// day and reject once the cap is hit.
//
// Storage is AgentState — the project's own durable state service, configured via
// `AGENTSTATE_API_KEY`. We call its State Platform REST API directly with `fetch`:
// only get + upsert are needed, so a focused two-call client beats depending on
// the full SDK. The daily reset is baked into the key (no TTL required — each day
// is a fresh key and old ones go cold), and the counter is a read-modify-write
// (AgentState has no atomic increment). The only race lets a client firing many
// concurrent requests squeak a few past the cap, which is fine for abuse control.

const BASE_URL = process.env.AGENTSTATE_BASE_URL ?? "https://agentstate.app/api";
const AGENT_ID = "eved-web-ratelimit";

/** Daily message allowance per IP. Override with `EVED_DAILY_MESSAGE_LIMIT`. */
export const DAILY_MESSAGE_LIMIT = Number(process.env.EVED_DAILY_MESSAGE_LIMIT ?? 30);

export interface RateDecision {
  /** True when the caller has already used up the daily allowance. */
  readonly limited: boolean;
  /** Messages used today after this call (0 when the limiter is disabled). */
  readonly used: number;
  /** The configured daily cap. */
  readonly limit: number;
}

function apiKey(): string | null {
  const key = process.env.AGENTSTATE_API_KEY;
  return key && key.length > 0 ? key : null;
}

/** UTC calendar day (`2026-06-18`). Baked into the key so each day resets. */
function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

async function call(key: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/** Read today's count for the state key, or 0 when no record exists yet. */
async function readCount(key: string, stateKey: string): Promise<number> {
  const res = await call(key, `/v1/states/${encodeURIComponent(stateKey)}`);
  if (res.status === 404) return 0; // first message today
  if (!res.ok) throw new Error(`AgentState getState ${res.status}`);
  const record = (await res.json()) as { data?: { count?: unknown } };
  const count = record.data?.count;
  return typeof count === "number" ? count : 0;
}

/** Persist the incremented count for the state key. */
async function writeCount(
  key: string,
  stateKey: string,
  count: number,
  ip: string,
  day: string,
): Promise<void> {
  const res = await call(key, `/v1/states/${encodeURIComponent(stateKey)}`, {
    method: "PUT",
    body: JSON.stringify({ agent_id: AGENT_ID, data: { count, ip, day }, tags: ["ratelimit"] }),
  });
  if (!res.ok) throw new Error(`AgentState upsertState ${res.status}`);
}

/**
 * Count one message for `ip` and report whether the daily cap is exceeded.
 *
 * Fails OPEN: when the limiter is unconfigured (no `AGENTSTATE_API_KEY`) or
 * AgentState is unreachable, the message is allowed rather than breaking chat on
 * a counter outage. A rate limiter is a guard rail, not a correctness gate.
 */
export async function consume(ip: string, now: number = Date.now()): Promise<RateDecision> {
  const key = apiKey();
  if (!key) return { limited: false, used: 0, limit: DAILY_MESSAGE_LIMIT };

  const day = utcDay(now);
  const stateKey = `ratelimit:web:${ip}:${day}`;
  try {
    const used = await readCount(key, stateKey);
    if (used >= DAILY_MESSAGE_LIMIT) {
      return { limited: true, used, limit: DAILY_MESSAGE_LIMIT };
    }
    await writeCount(key, stateKey, used + 1, ip, day);
    return { limited: false, used: used + 1, limit: DAILY_MESSAGE_LIMIT };
  } catch (err) {
    console.warn("[rate-limit] AgentState unavailable, allowing message (fail-open):", err);
    return { limited: false, used: 0, limit: DAILY_MESSAGE_LIMIT };
  }
}
