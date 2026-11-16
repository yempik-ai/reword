import type { NextConfig } from "next";
import { withReword } from "./src/reword/next.ts";

// The demo site is static. On GitHub Pages it is exported and served under
// /reword (NEXT_OUTPUT=export, NEXT_PUBLIC_BASE_PATH=/reword); anywhere else
// leave both unset.
const exported = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  output: exported ? "export" : undefined,
  images: { unoptimized: true },
};

export default withReword(nextConfig);
