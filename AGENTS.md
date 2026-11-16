# Working in reword

reword is two things in one repository: an in-place copy editor for websites
(`src/reword`) and the small site that demonstrates it (everything else). Read
the [README](README.md) for what it does.

## Commands

```bash
npm run edit      # the site with reword, on 127.0.0.1
npm run dev       # the site without it
npm run draft     # the pending copy draft, with the procedure to publish it
npm run check     # lint, types, tests, build: the definition of done
```

## Publishing a copy draft

When asked to publish the reword draft, run `npm run draft` and follow the
procedure it prints. Do not improvise another one.

## Rules

- **The tool is self-contained.** `src/reword` is copied into other sites. It
  imports nothing from the rest of this repository.
- **Two runtimes.** Everything in `src/reword` outside `client` is also run by
  Node without a bundler. Import with the `.ts` extension. Use only erasable
  TypeScript syntax (no enums, no parameter properties).
- **Safety contract.** Read the Safety section of the README before touching
  `guard.ts`, `next.ts`, `Mount.tsx`, `workspace.ts`, `literals.ts` or
  `agents.ts`. Never weaken it: the write route must not exist in production,
  must answer loopback and same-origin requests only, and must change only the
  value of one existing string. The prompt sent to an agent is a constant.
- **Copy lives in `src/content`,** keyed by locale (`en`, `it`). A copy change
  touches every locale in the same commit. Components render content strings
  untouched: no trimming, joining or case changes in code, or the string stops
  being editable.
- **No em dashes** in copy or docs. `reword.config.ts` enforces it for copy.
  (The block at the end of this file is written by Next.js, not by us.)
- **Tests sit next to the module.** A behaviour change comes with a test.
- **The site is static.** No middleware, no server state. `NEXT_OUTPUT=export`
  must keep building (GitHub Pages).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
