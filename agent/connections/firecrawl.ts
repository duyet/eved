import { defineMcpClientConnection } from "eve/connections";

// Firecrawl hosted MCP. Needs FIRECRAWL_API_KEY (https://firecrawl.dev dashboard),
// sent as `Authorization: Bearer <key>`.
export default defineMcpClientConnection({
  url: "https://mcp.firecrawl.dev/v2/mcp",
  description:
    "Read the open web: scrape a page, search the web, crawl or map a whole site, " +
    "and extract structured data from URLs.",
  auth: {
    getToken: async () => ({ token: process.env.FIRECRAWL_API_KEY! }),
  },
});
