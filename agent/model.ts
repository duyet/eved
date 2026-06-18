import { createAnyRouter } from "@anyr/ai-sdk-provider";

// AnyRouter provider for the Vercel AI SDK. Reads ANYROUTER_API_KEY from the
// environment (lazily, at request time) and targets https://anyrouter.dev/api/v1.
export const anyrouter = createAnyRouter();

// Model id in `provider/model` form — catalog at https://anyrouter.dev/models
export const MODEL = "google/gemini-3.1-flash-lite";

// Context window for MODEL, in tokens. AnyRouter is reached as a direct provider
// ("external" routing), so eve can't read this from the AI Gateway catalog — we
// supply it so compaction compiles. Source: AnyRouter models API (context_length).
export const MODEL_CONTEXT_WINDOW_TOKENS = 1_000_000;

// Configured language model, reused by the agent and the smoke test.
export const model = anyrouter(MODEL);
