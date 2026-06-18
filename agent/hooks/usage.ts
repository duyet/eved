import { defineHook } from "eve/hooks";
import {
  recordModel,
  recordToolCalls,
  recordTransport,
  recordTurn,
  recordUsage,
  recordUser,
} from "../lib/session-meta.ts";

// Channel-agnostic session telemetry. This hook observes the runtime stream and
// folds platform, caller, model, token usage, cost, and tool-call counts into the
// durable session-meta state. It reads the transport from `ctx.channel.kind`, so
// it works for every channel — current and future — without per-channel wiring.

export default defineHook({
  events: {
    "session.started"(event, ctx) {
      recordTransport(ctx.channel.kind);
      recordUser(ctx.session.auth);
      recordModel(event.data.runtime?.modelId);
    },

    // Refresh transport/caller each turn: a session can be resumed by a different
    // caller, and the model id is only authoritative once a turn is underway.
    "turn.started"(_event, ctx) {
      recordTransport(ctx.channel.kind);
      recordUser(ctx.session.auth);
    },

    "actions.requested"(event) {
      const names = event.data.actions.map((action) => {
        if (action.kind === "tool-call") return action.toolName;
        if (action.kind === "subagent-call") return `subagent:${action.name}`;
        if (action.kind === "remote-agent-call") return `remote:${action.name}`;
        return action.kind;
      });
      recordToolCalls(names);
    },

    "step.completed"(event) {
      if (event.data.usage) recordUsage(null, event.data.usage);
    },

    "turn.completed"() {
      recordTurn();
    },
  },
});
