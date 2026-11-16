import type { RewordConfig } from "./config";

/**
 * reword on the page, in two cases only, both resolved at build time:
 * - `npm run edit` (development, REWORD=1): the editor with the dev server's
 *   API, which writes your content files;
 * - a playground build (NEXT_PUBLIC_REWORD_PLAYGROUND=1): the editor with a
 *   backend in the visitor's browser, and no API at all.
 * Any other build has neither the import nor the code. Render it once,
 * inside <body>: `<RewordMount config={config} />`. A site with a Next.js
 * `basePath` passes it too, so the editor finds its API or its index.
 */
const Reword =
  (process.env.NODE_ENV === "development" && process.env.REWORD === "1") ||
  process.env.NEXT_PUBLIC_REWORD_PLAYGROUND === "1"
    ? (await import("./client/Reword")).default
    : null;

export default function RewordMount({ config, basePath = "" }: { config: RewordConfig; basePath?: string }) {
  return Reword ? (
    <Reword
      locales={config.locales}
      forbid={config.forbid}
      check={config.check}
      structuralKeys={config.structuralKeys}
      basePath={basePath}
    />
  ) : null;
}
