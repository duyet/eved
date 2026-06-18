"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import { useEveAgent, type EveMessage } from "eve/react";
import { useAuth, useClerk } from "@clerk/nextjs";

type ContentPart = Exclude<ThreadMessageLike["content"], string>[number];

// Map an eve message's parts onto assistant-ui content parts. We surface text,
// reasoning (streamed "thinking"), and tool calls (with their live state) so the
// UI can render loading, reasoning, and tool activity — not just final text.
function toContent(message: EveMessage): ContentPart[] {
  const content: ContentPart[] = [];
  for (const part of message.parts) {
    switch (part.type) {
      case "text":
        if (part.text) content.push({ type: "text", text: part.text });
        break;
      case "reasoning":
        if (part.text) content.push({ type: "reasoning", text: part.text });
        break;
      case "dynamic-tool": {
        const args =
          part.input && typeof part.input === "object"
            ? (part.input as Record<string, unknown>)
            : undefined;
        const hasOutput = part.state === "output-available";
        const isError = part.state === "output-error";
        content.push({
          type: "tool-call",
          toolCallId: part.toolCallId,
          toolName: part.toolMetadata?.eve?.name ?? part.toolName,
          args: args ?? {},
          result: hasOutput ? part.output : isError ? part.errorText : undefined,
          isError: isError || undefined,
        });
        break;
      }
      default:
        break; // step-start and anything else: nothing to render.
    }
  }
  return content;
}

function toThreadMessage(message: EveMessage): ThreadMessageLike {
  const content = toContent(message);
  const isAssistant = message.role !== "user";
  const streaming = message.metadata?.status === "streaming";
  return {
    id: message.id,
    role: isAssistant ? "assistant" : "user",
    content: content.length > 0 ? content : [{ type: "text", text: "" }],
    // assistant-ui throws "status is only supported for assistant messages" if a
    // status lands on a user/system message, so only attach it to assistant turns.
    ...(isAssistant
      ? { status: streaming ? { type: "running" } : { type: "complete" } }
      : {}),
  };
}

export function EveRuntimeProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();
  // Resolved before each eve request; the agent verifies it server-side.
  const agent = useEveAgent({
    headers: async () => {
      const token = await getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  });
  const isRunning = agent.status === "submitted" || agent.status === "streaming";

  // A message a signed-out visitor tried to send; replayed once they sign in.
  const pendingRef = useRef<string | null>(null);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const part = message.content.find((c) => c.type === "text");
      const text = part && part.type === "text" ? part.text : "";
      if (!text.trim()) return;
      // The chat UI is open to everyone, but sending requires sign-in: stash the
      // message and open the Clerk dialog instead of submitting it anonymously.
      if (!isSignedIn) {
        pendingRef.current = text;
        clerk.openSignIn();
        return;
      }
      await agent.send({ message: text });
    },
    [agent, isSignedIn, clerk],
  );

  // Once signed in, send the message the visitor attempted while signed out.
  useEffect(() => {
    if (isSignedIn && pendingRef.current) {
      const text = pendingRef.current;
      pendingRef.current = null;
      void agent.send({ message: text });
    }
  }, [isSignedIn, agent]);

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages: agent.data.messages,
    convertMessage: toThreadMessage,
    onNew,
    onCancel: () => agent.stop(),
  });

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}
