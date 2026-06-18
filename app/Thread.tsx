"use client";

import { ThreadPrimitive, MessagePrimitive, ComposerPrimitive, useThread } from "@assistant-ui/react";
import type {
  ReasoningMessagePartProps,
  TextMessagePartProps,
  ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

const SUGGESTIONS = [
  { label: "About Duyet", prompt: "Who is Duyet and what does he do?" },
  { label: "Duyet's CV", prompt: "Show me Duyet's CV and experience." },
  { label: "Send a JD", prompt: "I'd like to share a job description for a role with Duyet." },
  { label: "Hire Duyet", prompt: "I'd like to hire Duyet." },
];

// Slow, expressive ease for the composer's glide from center to bottom.
const GLIDE = { type: "spring", stiffness: 210, damping: 30, mass: 0.9 } as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Stagger the suggestion pills in after the hero settles.
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
};
const pillVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

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
  // Drives the layout: composer is centered while the thread is empty, then
  // glides to the bottom once the first message lands.
  const isEmpty = useThread((t) => t.messages.length === 0);

  return (
    <MotionConfig reducedMotion="user">
      <ThreadPrimitive.Root className="thread-root" data-empty={isEmpty}>
        <ThreadPrimitive.Viewport className="thread">
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

        {/* The dock holds the composer (always) plus the hero + suggestions
            (only while empty). `layout` makes the whole group animate from
            screen-center to the bottom via FLIP when the state flips. */}
        <motion.div layout className="dock" transition={{ layout: GLIDE }}>
          <AnimatePresence>
            {isEmpty && (
              <motion.div
                key="hero"
                className="welcome"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } }}
              >
                <div className="welcome-title">Chat with eved</div>
                <div className="welcome-sub">
                  Duyet&apos;s assistant — ask about him, his work, or how to work with him.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ComposerPrimitive.Root className="composer">
            <ComposerPrimitive.Input placeholder="Message eved…" rows={1} autoFocus />
            <ComposerPrimitive.Send>Send</ComposerPrimitive.Send>
          </ComposerPrimitive.Root>

          <AnimatePresence>
            {isEmpty && (
              <motion.div
                key="suggestions"
                className="suggestions"
                variants={listVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {SUGGESTIONS.map((s) => (
                  <motion.div key={s.label} variants={pillVariants}>
                    <ThreadPrimitive.Suggestion
                      className="suggestion"
                      prompt={s.prompt}
                      method="replace"
                      autoSend
                    >
                      {s.label}
                    </ThreadPrimitive.Suggestion>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </ThreadPrimitive.Root>
    </MotionConfig>
  );
}
