import { defineMcpClientConnection } from "eve/connections";

// ClickHouse Monitor MCP — analytics, metrics, and operational insights from the
// monitoring dashboard. Project: github.com/duyet/clickhouse-monitoring
// If the endpoint requires a key, add:
//   auth: { getToken: async () => ({ token: process.env.CHMONITOR_API_KEY! }) }
export default defineMcpClientConnection({
  url: "https://dash.chmonitor.dev/api/mcp",
  description:
    "ClickHouse Monitor: query ClickHouse cluster analytics and insights — metrics, " +
    "query performance, running queries, tables/parts, and operational health.",
});
