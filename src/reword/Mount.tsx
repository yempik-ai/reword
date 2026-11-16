import type { RewordConfig } from "./config";

/**
 * reword on the page, only under `npm run edit`. The condition is resolved at
 * build time, so a production build has neither the import nor the code.
 * Render it once, inside <body>: `<RewordMount config={config} />`. A site
 * with a Next.js `basePath` passes it too, so the editor finds its API.
 */
const Reword =
  process.env.NODE_ENV === "development" && process.env.REWORD === "1"
    ? (await import("./client/Reword")).default
    : null;

export default function RewordMount({ config, basePath = "" }: { config: RewordConfig; basePath?: string }) {
  return Reword ? <Reword locales={config.locales} forbid={config.forbid} basePath={basePath} /> : null;
}
