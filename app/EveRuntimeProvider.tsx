"use client";

import { type ReactNode, useCallback } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import { useEveAgent, type EveMessage } from "eve/react";

// Map one eve message → an assistant-ui message (text parts only, for a basic chat).
function toThreadMessage(message: EveMessage): ThreadMessageLike {
  const text = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: [{ type: "text", text }],
  };
}

export function EveRuntimeProvider({ children }: { children: ReactNode }) {
  const agent = useEveAgent();
  const isRunning =
    agent.status === "submitted" || agent.status === "streaming";

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const part = message.content.find((c) => c.type === "text");
      const text = part && part.type === "text" ? part.text : "";
      if (text.trim()) await agent.send({ message: text });
    },
    [agent],
  );

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages: agent.data.messages,
    convertMessage: toThreadMessage,
    onNew,
    onCancel: () => agent.stop(),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
