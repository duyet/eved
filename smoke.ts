// Smoke test: confirms AnyRouter routing + the ANYROUTER_API_KEY work end to end.
// Run once: bun smoke.ts   (bun auto-loads .env.local)
// Pass = it prints a non-empty reply. On 401/403, check ANYROUTER_API_KEY (sk-ar-…).
import { generateText } from "ai";
import { model, MODEL } from "./agent/model.ts";

const { text, usage } = await generateText({
  model,
  prompt: "Reply with exactly: anyrouter-ok",
});

console.log(`[smoke] model=${MODEL}`);
console.log(`[smoke] reply=${JSON.stringify(text)}`);
console.log(`[smoke] tokens=${usage?.totalTokens ?? "?"}`);
