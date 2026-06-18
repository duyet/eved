// Dynamic transport registry.
//
// A "transport" is the surface a conversation reaches eved through — the web
// chat, a Telegram bot, and (later) Slack, Discord, and friends. eve gives every
// session a channel `kind` (the adapter kind, e.g. `http` for the web channel or
// `telegram` for the Telegram bot); this module maps that kind onto a stable,
// human-readable transport descriptor.
//
// Everything that needs to know "where did this conversation come from?" — the
// usage tracker, the support forwarder, the web UI — resolves it through
// `resolveTransport()`, so adding a new transport later is a single entry below.
// Unknown kinds still resolve to a usable descriptor, so a brand-new channel is
// tracked the moment it is wired up, even before it is registered here.

export interface Transport {
  /** Stable id used in durable state, analytics, and logs (e.g. `web`, `telegram`). */
  readonly id: string;
  /** Human label shown to operators (support forwards, dashboards). */
  readonly label: string;
  /** Compact badge/emoji for tight spots (chips, forwarded message headers). */
  readonly badge: string;
}

// Keyed by eve's channel adapter `kind`. The web chat runs on eve's default HTTP
// channel, whose adapter kind is `http`; every platform channel uses its own kind.
const TRANSPORTS: Record<string, Transport> = {
  http: { id: "web", label: "Web", badge: "🌐" },
  telegram: { id: "telegram", label: "Telegram", badge: "✈️" },
  slack: { id: "slack", label: "Slack", badge: "💬" },
  discord: { id: "discord", label: "Discord", badge: "🎮" },
  teams: { id: "teams", label: "Teams", badge: "🟣" },
  twilio: { id: "twilio", label: "SMS / Voice", badge: "📞" },
  github: { id: "github", label: "GitHub", badge: "🐙" },
  linear: { id: "linear", label: "Linear", badge: "📐" },
};

/** Fallback used when a session has no channel kind at all (e.g. a schedule). */
export const UNKNOWN_TRANSPORT: Transport = { id: "unknown", label: "Unknown", badge: "❔" };

/**
 * Resolve an eve channel `kind` into a {@link Transport}. Registered kinds get
 * their curated descriptor; an unregistered kind is still given a stable,
 * readable descriptor derived from the kind itself, so new channels are tracked
 * before anyone remembers to register them here.
 */
export function resolveTransport(kind: string | null | undefined): Transport {
  if (!kind) return UNKNOWN_TRANSPORT;
  const known = TRANSPORTS[kind];
  if (known) return known;
  return { id: kind, label: kind.charAt(0).toUpperCase() + kind.slice(1), badge: "🔌" };
}
