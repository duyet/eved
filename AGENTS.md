# eve Agent App

This project uses the eve framework. Before writing code, always read the relevant guide in `node_modules/eve/docs/`.

## Project-specific notes

- **Node 24 + `.ts` import extensions.** eve runs raw `.ts` through Node's native
  type-stripping, which does NOT rewrite `.js`→`.ts`. Relative imports between agent
  modules must use the real `.ts` extension (`import { model } from "./model.ts"`),
  matching eve's generated module map. `tsconfig` enables `allowImportingTsExtensions`
  so `tsgo` accepts it.
- **Typecheck:** `bun run typecheck` (runs `tsgo`).
- **Smoke-test the model end-to-end:** `bun smoke.ts` — loads `.env.local`, needs `ANYROUTER_API_KEY`.
- **Model provider:** set in `agent/model.ts` via AnyRouter (`@anyr/ai-sdk-provider`);
  `agent/agent.ts` sets `modelContextWindowTokens` explicitly because external routing
  can't read it from eve's AI Gateway catalog.

## Transports, telemetry & support forwarding

- **Transports are dynamic.** `agent/lib/transports.ts` maps an eve channel `kind`
  (`http` = web chat, `telegram`, …) onto a stable `{ id, label, badge }`. Adding a
  new channel later means adding one entry; unknown kinds still resolve to a usable
  descriptor, so a new channel is tracked the moment it's wired up.
- **Per-session telemetry.** `agent/lib/session-meta.ts` is a `defineState` slot
  holding the transport, caller, model, token totals, estimated cost, and tool-call
  count. `agent/hooks/usage.ts` populates it from the runtime stream (channel-agnostic,
  via `ctx.channel.kind` + `ctx.session.auth`). Cost rates live in `agent/lib/pricing.ts`
  (USD per 1M tokens, approximate — update as models change).
- **Telegram channel** (`agent/channels/telegram.ts`, bot `@evedx_bot`) renders the
  model's Markdown into Telegram HTML (`agent/lib/telegram-format.ts`) so replies get
  real bold/italics/links/code. Needs `TELEGRAM_BOT_TOKEN` and
  `TELEGRAM_WEBHOOK_SECRET_TOKEN`; register the webhook manually (see the channel file).
- **Support forwarding.** `agent/hooks/support-forward.ts` forwards every inbound
  message and reply to a Telegram support chat, with a metadata header (user, platform,
  model, tokens, cost, tools) separated by a rule from the body. Set
  `TELEGRAM_SUPPORT_CHAT_ID` (plus `TELEGRAM_BOT_TOKEN`) to enable; it's a silent no-op
  otherwise.
- **Web UI** (`app/EveRuntimeProvider.tsx`, `app/Thread.tsx`) renders streaming text,
  reasoning ("thinking"), live tool calls, and a typing indicator while the agent works.
