import { defineMcpClientConnection } from "eve/connections";

// Duyet's public MCP server — no auth. Source: github.com/duyet/duyet-mcp-server
export default defineMcpClientConnection({
  url: "https://mcp.duyet.net/mcp",
  description:
    "Everything about Duyet (duyet.net): his bio/about, CV, blog posts and their content, " +
    "recent GitHub activity, and ways to reach him (say hi, hire, send a message).",
});
