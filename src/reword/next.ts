import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

// The API route that writes files is named `route.reword.ts`. Only with this
// extra page extension is it a route at all, and the extension is added only
// in the dev server started by `npm run edit` (REWORD=1). A production build
// and a plain `npm run dev` cannot contain it.

const EXTENSIONS = ["tsx", "ts", "jsx", "js"];

type ConfigFunction = (phase: string, context: { defaultConfig: NextConfig }) => NextConfig | Promise<NextConfig>;

/** Wraps a Next.js config so that reword exists under `npm run edit` and nowhere else. */
export function withReword(config: NextConfig | ConfigFunction = {}): ConfigFunction {
  return async (phase, context) => {
    const base = typeof config === "function" ? await config(phase, context) : config;
    if (phase !== PHASE_DEVELOPMENT_SERVER || process.env.REWORD !== "1") return base;
    return { ...base, pageExtensions: ["reword.ts", ...(base.pageExtensions ?? EXTENSIONS)] };
  };
}
