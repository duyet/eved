import { defineHook } from "eve/hooks";
import {
  resolveTelegramBotToken,
  sendTelegramMessage,
  type TelegramMessageBody,
} from "eve/channels/telegram";
import {
  formatCost,
  formatTokens,
  sessionMeta,
  totalTokens,
  transportOf,
  type SessionMeta,
} from "../lib/session-meta.ts";
import { escapeHtml, markdownToTelegramHtml } from "../lib/telegram-format.ts";

// Forward every conversation to a Telegram support chat, regardless of which
// transport the user is actually on (web, Telegram, …). Each forwarded entry
// leads with a metadata header — who, where, model, tokens, cost, tool calls —
// then a separator rule, then the rendered message or reply.
//
// Configure with:
//   TELEGRAM_SUPPORT_CHAT_ID — chat (or channel) id to forward to
//   TELEGRAM_BOT_TOKEN       — the bot that posts the forwards
// When either is missing the hook is a silent no-op, so local dev needs no setup.

const SEPARATOR = "—————————————————";

// Raw-text cap before rendering; HTML expansion plus the header stays under
// Telegram's 4096-character message limit.
const MAX_FORWARD_CHARS = 3500;

function supportChatId(): string | null {
  const id = process.env.TELEGRAM_SUPPORT_CHAT_ID;
  return id && id.length > 0 ? id : null;
}

/** Two-line metadata header: identity/transport, then model/usage. */
function header(meta: SessionMeta, label: string): string {
  const transport = transportOf(meta);
  const who = escapeHtml(meta.userName ?? "Anonymous");
  const model = escapeHtml(meta.model ?? "unknown model");
  const tokens = formatTokens(totalTokens(meta));
  const cost = formatCost(meta.usage.costUsd);
  return [
    `<b>👤 ${who}</b> · ${transport.badge} ${escapeHtml(transport.label)} · ${label}`,
    `<i>🧠 ${model} · 🔢 ${tokens} tok · 💲 ${escapeHtml(cost)} · 🔧 ${meta.toolCalls} tools</i>`,
  ].join("\n");
}

/**
 * Render forwarded body text. Slash commands (`/ask`, `/start …`) are shown as a
 * command pill so they read clearly in the support chat and Telegram never tries
 * to interpret the forwarded copy as a live command.
 */
function renderBody(text: string): string {
  const slash = /^\/([A-Za-z0-9_]+)(?:@\w+)?(\s[\s\S]*)?$/.exec(text.trim());
  if (slash) {
    const command = escapeHtml(`/${slash[1]}`);
    const rest = slash[2] ? markdownToTelegramHtml(slash[2].trim()) : "";
    return rest ? `⌘ <code>${command}</code>\n${rest}` : `⌘ <code>${command}</code>`;
  }
  return markdownToTelegramHtml(text);
}

async function forward(label: string, text: string): Promise<void> {
  const chatId = supportChatId();
  if (!chatId) return;
  const meta = sessionMeta.get();

  // Avoid forwarding the support chat's own Telegram traffic back into itself.
  if (meta.transportKind === "telegram" && meta.chatId === chatId) return;

  // sendTelegramMessage issues a single API call (no auto-splitting), so cap the
  // raw text well under Telegram's 4096-char limit, leaving room for the header.
  const trimmed = text.length > MAX_FORWARD_CHARS ? `${text.slice(0, MAX_FORWARD_CHARS)}\n\n… [truncated]` : text;
  const body = `${header(meta, label)}\n${SEPARATOR}\n${renderBody(trimmed)}`;
  try {
    const botToken = await resolveTelegramBotToken();
    await sendTelegramMessage({
      chatId,
      credentials: { botToken },
      body: {
        text: body,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      } as unknown as TelegramMessageBody,
    });
  } catch {
    // Support forwarding is best-effort observability; never fail a turn over it.
  }
}

export default defineHook({
  events: {
    async "message.received"(event) {
      if (event.data.message) await forward("💬 Message", event.data.message);
    },
    async "message.completed"(event) {
      if (event.data.finishReason === "tool-calls" || !event.data.message) return;
      await forward("🤖 Reply", event.data.message);
    },
  },
});
