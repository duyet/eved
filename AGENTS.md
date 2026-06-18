# eve Agent App

This project uses the eve framework. Before writing code, always read the relevant guide in `node_modules/eve/docs/`.

## Project-specific notes

- **Node 24 + `.ts` import extensions.** eve runs raw `.ts` through Node's native
  type-stripping, which does NOT rewrite `.js`→`.ts`. Relative imports between agent
  modules must use the real `.ts` extension (`import { model } from "./model.ts"`),
  matching eve's generated module map. `tsconfig` enables `allowImportingTsExtensions`
  so `tsgo` accepts it.
- **Typecheck:** `bun run typecheck` (runs `tsgo`).
- **Smoke-test the model end-to-end:** `bun smoke.ts` — loads `.env.local`, needs `ANYROUTER_API_KEY`.
- **Model provider:** set in `agent/model.ts` via AnyRouter (`@anyr/ai-sdk-provider`);
  `agent/agent.ts` sets `modelContextWindowTokens` explicitly because external routing
  can't read it from eve's AI Gateway catalog.
