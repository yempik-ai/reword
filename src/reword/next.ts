import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

// The API route that writes files is named `route.reword.ts`. Only with this
// extra page extension is it a route at all, and the extension is added only
// in the dev server started by `npm run edit` (REWORD=1). A production build
// and a plain `npm run dev` cannot contain it.
//
// Playground mode (NEXT_PUBLIC_REWORD_PLAYGROUND=1) never adds the extension:
// a playground build ships the editor's browser half and no route.

const EXTENSIONS = ["tsx", "ts", "jsx", "js"];

type ConfigFunction = (phase: string, context: { defaultConfig: NextConfig }) => NextConfig | Promise<NextConfig>;

/** Wraps a Next.js config so that reword exists under `npm run edit` and nowhere else. */
export function withReword(config: NextConfig | ConfigFunction = {}): ConfigFunction {
  return async (phase, context) => {
    const base = typeof config === "function" ? await config(phase, context) : config;
    // Always defined, so every build reads the flag as a constant and drops
    // the editor's import when it is off. Next.js leaves an unset variable
    // to be read at run time, and the import would stay in the bundle.
    const playground = process.env.NEXT_PUBLIC_REWORD_PLAYGROUND === "1" ? "1" : "0";
    const flagged = { ...base, env: { ...base.env, NEXT_PUBLIC_REWORD_PLAYGROUND: playground } };
    if (phase !== PHASE_DEVELOPMENT_SERVER || process.env.REWORD !== "1") return flagged;
    return { ...flagged, pageExtensions: ["reword.ts", ...(base.pageExtensions ?? EXTENSIONS)] };
  };
}
