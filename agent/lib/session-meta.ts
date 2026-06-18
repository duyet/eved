import { defineState } from "eve/context";
import type { SessionAuth } from "eve/context";
import { resolveTransport, type Transport } from "./transports.ts";
import { estimateCostUsd } from "./pricing.ts";

// Durable, per-session telemetry for eved: which transport the conversation
// arrived on, who is on the other end, and the running model/usage/cost totals.
//
// This is the single source of truth the usage hook writes to and the support
// forwarder reads from. It is conversation-scoped (lives and dies with the
// session); anything that must outlive a session belongs in an external store.

export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Estimated USD cost — see agent/lib/pricing.ts. */
  costUsd: number;
}

export interface SessionMeta {
  /** Stable transport id (`web`, `telegram`, …). */
  transport: string;
  /** Raw eve channel adapter kind this session arrived on. */
  transportKind: string | null;
  /** Best-effort display name of the human on the other end. */
  userName: string | null;
  /** Transport-native user id, when the channel exposes one. */
  userId: string | null;
  /** Transport-native conversation/chat id, when the channel exposes one. */
  chatId: string | null;
  /** Model id reported by the runtime for this session. */
  model: string | null;
  /** Number of completed turns. */
  turns: number;
  /** Total tool calls requested across the session. */
  toolCalls: number;
  /** Distinct tool names used, in first-seen order. */
  toolNames: string[];
  usage: UsageTotals;
}

function initialMeta(): SessionMeta {
  return {
    transport: "unknown",
    transportKind: null,
    userName: null,
    userId: null,
    chatId: null,
    model: null,
    turns: 0,
    toolCalls: 0,
    toolNames: [],
    usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0 },
  };
}

export const sessionMeta = defineState<SessionMeta>("eved.session-meta", initialMeta);

/** Record (or refresh) which transport this session is on, from the channel kind. */
export function recordTransport(kind: string | null | undefined): void {
  const transport = resolveTransport(kind);
  sessionMeta.update((s) => ({ ...s, transport: transport.id, transportKind: kind ?? null }));
}

/**
 * Derive a best-effort display name and id from the caller's auth. Channels vary
 * in what they expose: Telegram puts `username`/`user_id` in `attributes`, while
 * the anonymous web channel has no auth at all. We read generically so any future
 * transport that fills these attributes is picked up without code changes here.
 */
export function recordUser(auth: SessionAuth | null | undefined): void {
  const current = auth?.current;
  if (!current) return;
  const attrs = current.attributes ?? {};
  const pick = (key: string): string | null => {
    const value = attrs[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  const userName =
    pick("username") ?? pick("name") ?? pick("user_name") ?? current.subject ?? null;
  const userId = pick("user_id") ?? pick("userId") ?? current.principalId ?? null;
  const chatId = pick("chat_id") ?? pick("chatId") ?? null;
  sessionMeta.update((s) => ({
    ...s,
    userName: userName ?? s.userName,
    userId: userId ?? s.userId,
    chatId: chatId ?? s.chatId,
  }));
}

/** Record the model id the runtime reported for this session. */
export function recordModel(modelId: string | null | undefined): void {
  if (!modelId) return;
  sessionMeta.update((s) => ({ ...s, model: s.model ?? modelId }));
}

/** Record one batch of requested tool calls, by name. */
export function recordToolCalls(names: readonly string[]): void {
  if (names.length === 0) return;
  sessionMeta.update((s) => {
    const toolNames = [...s.toolNames];
    for (const name of names) if (!toolNames.includes(name)) toolNames.push(name);
    return { ...s, toolCalls: s.toolCalls + names.length, toolNames };
  });
}

export interface UsageDelta {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
}

/** Add one step's token usage to the totals and accrue its estimated cost. */
export function recordUsage(modelId: string | null | undefined, delta: UsageDelta): void {
  sessionMeta.update((s) => ({
    ...s,
    usage: {
      inputTokens: s.usage.inputTokens + (delta.inputTokens ?? 0),
      outputTokens: s.usage.outputTokens + (delta.outputTokens ?? 0),
      cacheReadTokens: s.usage.cacheReadTokens + (delta.cacheReadTokens ?? 0),
      cacheWriteTokens: s.usage.cacheWriteTokens + (delta.cacheWriteTokens ?? 0),
      costUsd: s.usage.costUsd + estimateCostUsd(modelId ?? s.model, delta),
    },
  }));
}

/** Increment the completed-turn counter. */
export function recordTurn(): void {
  sessionMeta.update((s) => ({ ...s, turns: s.turns + 1 }));
}

/** Total token count (prompt + completion + cache) across the session. */
export function totalTokens(meta: SessionMeta): number {
  const u = meta.usage;
  return u.inputTokens + u.outputTokens + u.cacheReadTokens + u.cacheWriteTokens;
}

/** Compact token count for headers, e.g. `12.3k`. */
export function formatTokens(count: number): string {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(1)}k`;
}

/** Format the running USD cost, e.g. `$0.0123`. */
export function formatCost(costUsd: number): string {
  if (costUsd <= 0) return "$0";
  if (costUsd < 0.01) return `$${costUsd.toFixed(4)}`;
  return `$${costUsd.toFixed(2)}`;
}

/** Resolve the transport descriptor for a meta snapshot. */
export function transportOf(meta: SessionMeta): Transport {
  return resolveTransport(meta.transportKind);
}
