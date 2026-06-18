"use client";

import { ThreadPrimitive, MessagePrimitive, ComposerPrimitive, useThread } from "@assistant-ui/react";
import type {
  ReasoningMessagePartProps,
  TextMessagePartProps,
  ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Streamdown } from "streamdown";

const SUGGESTIONS = [
  { label: "About Duyet", prompt: "Who is Duyet and what does he do?" },
  { label: "Duyet's CV", prompt: "Show me Duyet's CV and experience." },
  { label: "Send a JD", prompt: "I'd like to share a job description for a role with Duyet." },
  { label: "Hire Duyet", prompt: "I'd like to hire Duyet." },
];

// Slow, expressive ease for the composer's glide from center to bottom.
const GLIDE = { type: "spring", stiffness: 210, damping: 30, mass: 0.9 } as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Cascade the empty state: the title shows first, then the subtitle.
const heroVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

// Suggestion pills come in AFTER the hero has appeared ("Chat with eved" first).
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.32 } },
};
const pillVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

// Assistant text, rendered as streaming-aware Markdown via Streamdown.
function Text({ text, status }: TextMessagePartProps) {
  const streaming = status?.type === "running";
  return (
    <Streamdown
      className="markdown"
      // No Tailwind in this project, so disable Streamdown's Tailwind-styled
      // controls (copy buttons) and link-safety modal; links open directly.
      controls={false}
      linkSafety={{ enabled: false }}
      isAnimating={streaming}
    >
      {text}
    </Streamdown>
  );
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

// One tool call, as a compact card: an icon badge + name + status pill, with
// height-capped, labeled input/output behind a disclosure (results can be large).
function ToolCall({ toolName, args, result, isError, status }: ToolCallMessagePartProps) {
  const running = status?.type === "running" || status?.type === "requires-action";
  const state = running ? "running" : isError ? "error" : "done";
  const label = running ? "Running" : isError ? "Failed" : "Done";
  const argsText = args && Object.keys(args).length > 0 ? JSON.stringify(args, null, 2) : null;
  const resultText =
    result === undefined
      ? null
      : typeof result === "string"
        ? result
        : JSON.stringify(result, null, 2);
  return (
    <div className={`tool-call state-${state}`}>
      <div className="tool-head">
        <span className="tool-badge" aria-hidden>
          {running ? <span className="spinner" /> : isError ? "⚠" : "✓"}
        </span>
        <span className="tool-name">{toolName}</span>
        <span className="tool-pill">{label}</span>
      </div>
      {(argsText || resultText) && (
        <details className="tool-detail">
          <summary>Details</summary>
          {argsText && (
            <div className="tool-block">
              <span className="tool-block-label">Input</span>
              <pre className="tool-code">{argsText}</pre>
            </div>
          )}
          {resultText && (
            <div className="tool-block">
              <span className="tool-block-label">Output</span>
              <pre className="tool-code">{resultText}</pre>
            </div>
          )}
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
                variants={heroVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } }}
              >
                <motion.div className="welcome-title" variants={heroItem}>
                  Chat with eved
                </motion.div>
                <motion.div className="welcome-sub" variants={heroItem}>
                  Duyet&apos;s assistant — ask about him, his work, or how to work with him.
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <ComposerPrimitive.Root className="composer">
            <ComposerPrimitive.Input placeholder="Message eved…" rows={1} autoFocus />
            <ComposerPrimitive.Send className="send-btn" aria-label="Send message">
              <svg className="send-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
              </svg>
            </ComposerPrimitive.Send>
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
