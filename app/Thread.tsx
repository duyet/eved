"use client";

import { ThreadPrimitive, MessagePrimitive, ComposerPrimitive } from "@assistant-ui/react";
import type {
  ReasoningMessagePartProps,
  TextMessagePartProps,
  ToolCallMessagePartProps,
} from "@assistant-ui/react";

const SUGGESTIONS = [
  { label: "About Duyet", prompt: "Who is Duyet and what does he do?" },
  { label: "Duyet's CV", prompt: "Show me Duyet's CV and experience." },
  { label: "Send a JD", prompt: "I'd like to share a job description for a role with Duyet." },
  { label: "Hire Duyet", prompt: "I'd like to hire Duyet." },
];

// Plain assistant/user text. Markdown is left as-is (CSS pre-wrap preserves it).
function Text({ text }: TextMessagePartProps) {
  return <p className="part-text">{text}</p>;
}

// Streamed reasoning ("thinking"), shown as a dim, collapsible block.
function Reasoning({ text, status }: ReasoningMessagePartProps) {
  const streaming = status?.type === "running";
  return (
    <details className="reasoning" open={streaming}>
      <summary>
        <span className="reasoning-icon">🧠</span>
        {streaming ? "Thinking…" : "Thought process"}
      </summary>
      <div className="reasoning-body">{text}</div>
    </details>
  );
}

// One tool call, with live status: running spinner, then result or error.
function ToolCall({ toolName, args, result, isError, status }: ToolCallMessagePartProps) {
  const running = status?.type === "running" || status?.type === "requires-action";
  const stateIcon = isError ? "⚠️" : running ? "" : "✓";
  const argsText = args && Object.keys(args).length > 0 ? JSON.stringify(args, null, 2) : null;
  const resultText =
    result === undefined
      ? null
      : typeof result === "string"
        ? result
        : JSON.stringify(result, null, 2);
  return (
    <div className={`tool-call${isError ? " tool-error" : ""}`}>
      <div className="tool-head">
        {running ? <span className="spinner" aria-hidden /> : <span className="tool-state">{stateIcon}</span>}
        <span className="tool-name">{toolName}</span>
        <span className="tool-status">{running ? "running…" : isError ? "failed" : "done"}</span>
      </div>
      {(argsText || resultText) && (
        <details className="tool-detail">
          <summary>details</summary>
          {argsText && <pre className="tool-args">{argsText}</pre>}
          {resultText && <pre className="tool-result">{resultText}</pre>}
        </details>
      )}
    </div>
  );
}

const MESSAGE_COMPONENTS = {
  Text,
  Reasoning,
  tools: { Fallback: ToolCall },
};

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
                <MessagePrimitive.Parts components={MESSAGE_COMPONENTS} />
              </MessagePrimitive.Root>
            ),
          }}
        />
        <ThreadPrimitive.If running>
          <div className="thinking" aria-label="Assistant is working">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>
      <ComposerPrimitive.Root className="composer">
        <ComposerPrimitive.Input placeholder="Message eved…" rows={1} autoFocus />
        <ComposerPrimitive.Send>Send</ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  );
}
