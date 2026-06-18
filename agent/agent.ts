import { defineAgent } from "eve";
import { model, MODEL_CONTEXT_WINDOW_TOKENS } from "./model.ts";

export default defineAgent({
  model,
  modelContextWindowTokens: MODEL_CONTEXT_WINDOW_TOKENS,
});
