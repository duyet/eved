import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Open on localhost for `eve dev` and the REPL.
    localDev(),
    // Lets the eve TUI and Vercel deployments reach the agent.
    vercelOidc(),
    // Public web chat: none() accepts anyone anonymously — it runs on Duyet's model
    // credits. Swap in real auth (httpBasic / oidc / jwt) or rate limiting before
    // exposing it widely.
    none(),
  ],
});
