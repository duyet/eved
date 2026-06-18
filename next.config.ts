import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {};

// withEve boots the eve agent alongside Next.js (one dev server, one Vercel deploy).
// agent/ is at the project root, so no eveRoot option is needed.
export default withEve(nextConfig);
