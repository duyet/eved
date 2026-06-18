"use client";

import { ThreadPrimitive, MessagePrimitive, ComposerPrimitive } from "@assistant-ui/react";

const SUGGESTIONS = [
  { label: "About Duyet", prompt: "Who is Duyet and what does he do?" },
  { label: "Duyet's CV", prompt: "Show me Duyet's CV and experience." },
  { label: "Send a JD", prompt: "I'd like to share a job description for a role with Duyet." },
  { label: "Hire Duyet", prompt: "I'd like to hire Duyet." },
];

export function Thread() {
  return (
    <ThreadPrimitive.Root className="thread-root">
      <ThreadPrimitive.Viewport className="thread">
        <ThreadPrimitive.Empty>
          <div className="welcome">
            <div className="welcome-title">Chat with eved</div>
            <div className="welcome-sub">
              Duyet&apos;s assistant — ask about him, his work, or how to work with him.
            </div>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <ThreadPrimitive.Suggestion
                  key={s.label}
                  className="suggestion"
                  prompt={s.prompt}
                  method="replace"
                  autoSend
                >
                  {s.label}
                </ThreadPrimitive.Suggestion>
              ))}
            </div>
          </div>
        </ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages
          components={{
            UserMessage: () => (
              <MessagePrimitive.Root className="msg user">
                <MessagePrimitive.Parts />
              </MessagePrimitive.Root>
            ),
            AssistantMessage: () => (
              <MessagePrimitive.Root className="msg assistant">
                <MessagePrimitive.Parts />
              </MessagePrimitive.Root>
            ),
          }}
        />
      </ThreadPrimitive.Viewport>
      <ComposerPrimitive.Root className="composer">
        <ComposerPrimitive.Input placeholder="Message eved…" rows={1} autoFocus />
        <ComposerPrimitive.Send>Send</ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  );
}
