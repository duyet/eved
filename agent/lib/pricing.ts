// Approximate model pricing, used to estimate the USD cost of a session from its
// token usage. Rates are USD per 1,000,000 tokens.
//
// These are estimates for observability, not billing. Routing through AnyRouter
// (see agent/model.ts) means the authoritative cost lives with the provider; keep
// these numbers roughly current and treat the result as a guide. Add or adjust
// entries as models change — `estimateCostUsd` matches the longest key that is a
// substring of the model id, then falls back to DEFAULT_RATES.

export interface ModelRates {
  /** USD per 1M input (prompt) tokens. */
  readonly input: number;
  /** USD per 1M output (completion) tokens. */
  readonly output: number;
  /** USD per 1M cached-read tokens. Defaults to a fraction of `input` when omitted. */
  readonly cacheRead?: number;
  /** USD per 1M cache-write tokens. Defaults to `input` when omitted. */
  readonly cacheWrite?: number;
}

export interface TokenUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
}

// Keyed by a substring of the model id (`provider/model`). Longest match wins.
const RATES: Record<string, ModelRates> = {
  "gemini-3.1-flash-lite": { input: 0.1, output: 0.4, cacheRead: 0.025 },
  "gemini-3.1-flash": { input: 0.3, output: 2.5, cacheRead: 0.075 },
  "gemini-3.1-pro": { input: 1.25, output: 10, cacheRead: 0.31 },
  "claude-opus": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  // Generic family aliases, so versioned ids (e.g. anthropic/claude-3-5-sonnet)
  // still resolve. More specific keys above win via longest-match.
  opus: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  sonnet: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  haiku: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  flash: { input: 0.3, output: 2.5, cacheRead: 0.075 },
};

/** Conservative default when a model id matches nothing above. */
const DEFAULT_RATES: ModelRates = { input: 0.5, output: 1.5 };

function ratesFor(modelId: string | null | undefined): ModelRates {
  if (!modelId) return DEFAULT_RATES;
  const id = modelId.toLowerCase();
  let best: ModelRates | undefined;
  let bestLen = 0;
  for (const [key, rates] of Object.entries(RATES)) {
    if (id.includes(key) && key.length > bestLen) {
      best = rates;
      bestLen = key.length;
    }
  }
  return best ?? DEFAULT_RATES;
}

/** Estimate the USD cost of one usage delta for the given model. */
export function estimateCostUsd(modelId: string | null | undefined, usage: TokenUsage): number {
  const rates = ratesFor(modelId);
  const cacheRead = rates.cacheRead ?? rates.input * 0.25;
  const cacheWrite = rates.cacheWrite ?? rates.input;
  const cost =
    ((usage.inputTokens ?? 0) * rates.input +
      (usage.outputTokens ?? 0) * rates.output +
      (usage.cacheReadTokens ?? 0) * cacheRead +
      (usage.cacheWriteTokens ?? 0) * cacheWrite) /
    1_000_000;
  return cost;
}
