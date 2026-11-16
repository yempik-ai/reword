# Adding reword to an existing site

This guide is written for a coding agent. Follow it from start to finish in the repository of the site that should get reword. The source to port is the folder [`src/reword`](src/reword) of `https://github.com/yempik-ai/reword`.

reword lets the site's author click any text on the running site, rewrite it in place, and hand the uncommitted edits to a coding agent for translation and publishing. An edit rewrites one string literal in the source. Git is the draft. Read the [README](README.md) first: it defines the behaviour you are installing.

## 0. Before you start

Find these facts in the target repository. Do not guess them.

| Fact | Where to look |
|---|---|
| Framework and version | `package.json`. This guide covers Next.js App Router. For anything else, read "Other frameworks" at the end and stop to ask if the port is not obvious |
| Where the copy lives | Folders with typed content: `src/content`, `content`, `messages`, `Record<Locale, ...>` objects in pages |
| The languages | The i18n config, the `[locale]` segment, `generateStaticParams` |
| How the page states its language | `<html lang>` must be set to the current locale |
| The check command | What CI runs: lint, types, tests, build |
| House rules for copy | `AGENTS.md`, `CLAUDE.md`, a style guide |

Requirements: React 19.2 or newer, Node.js 22.18 or newer, the `typescript` package version 5 or 6, a git repository with one commit.

## 1. Prove the route gate first

The route that writes files must not exist in production. reword achieves that with an extra page extension that is added only in the editing dev server.

1. Copy `src/reword/next.ts` and wrap the Next.js config: `export default withReword(config)`. If the config is already wrapped by another plugin, wrap the result.
2. Add a throwaway `src/app/api/reword/ping/route.reword.ts` that returns `ok`.
3. Confirm all three:
   - `REWORD=1 next dev`: `GET /api/reword/ping` answers 200.
   - plain `next dev`: it answers 404.
   - `next build`: the route table does not list it.

If any of the three fails on this version of Next.js, stop and report. Do not replace the gate with a route that returns 404 at run time. Delete the throwaway route when it passes.

## 2. Copy the tool

```bash
npx degit yempik-ai/reword/src/reword src/reword
npm install zod   # if the project does not have it
```

Copy `scripts/draft.ts` as well. Keep the folder as it is: it is self-contained and imports nothing from the site. It comes with its tests (`*.test.ts`, Vitest): keep them if the project uses Vitest, port them to the project's runner, or delete them.

The server half is run in two ways: bundled by Next.js, and directly by Node for `npm run draft`. That is why its relative imports carry the `.ts` extension. If the project's `tsconfig.json` does not allow that, add `"allowImportingTsExtensions": true`. If the project uses `tsx` already, running the script with `tsx` works too.

## 3. Configure

Create `reword.config.ts` at the project root.

```ts
import { defineConfig } from "./src/reword/config.ts";

export default defineConfig({
  locales: ["en", "it"],        // the site's languages, as the URL and <html lang> name them
  content: ["src/content"],     // every folder that holds copy
  check: "npm run check",       // what CI runs
  forbid: [],                   // house rules: { pattern, message }
});
```

- A single-language site lists one locale. reword then decides what is copy from property names and value shapes. Review `structuralKeys` against the site's own field names and add the ones that hold identifiers.
- If the copy is spread across pages and components, list those folders in `content`. reword keeps only strings that qualify as copy, so wide roots are safe on a multilingual site.
- Exclude generated files. If a content folder holds files written by a script, move them out of the roots or split the folder: an edit there would be overwritten.

## 4. Wire it

1. **Route.** `src/app/api/reword/[action]/route.reword.ts`:

   ```ts
   import config from "<relative path>/reword.config";
   import { rewordRoutes } from "@/reword/routes";

   export const { GET, POST } = rewordRoutes(config);
   ```

   If the site has a middleware or a proxy, make sure its matcher skips `/api`.

2. **Mount.** In the root layout, inside `<body>`, after the page content: `<RewordMount config={config} />`. If the Next.js config sets a `basePath`, pass the same value: `<RewordMount config={config} basePath="/docs" />`. `Mount.tsx` loads the interface with a condition resolved at build time. Do not move that condition into a client component.

3. **Scripts.**

   ```json
   {
     "edit": "REWORD=1 next dev --hostname 127.0.0.1",
     "draft": "node scripts/draft.ts"
   }
   ```

   Keep `--hostname 127.0.0.1`. Keep any options the project's own `dev` script needs.

4. **Ignore.** Add `/.reword/` to `.gitignore`.

## 5. Make the copy reachable

reword finds copy by equality: a text node on the page that equals a content string is that string. Run the edit server, open the main pages in every language, and measure before you change anything:

1. Count the visible text nodes that equal a string from `GET /api/reword/literals?locale=<locale>`.
2. List the ones that do not, and sort them into: identity (same in every language), computed (dates, numbers), and copy that should be editable but is not.

Fix only the third group, and only when the fix is small:

| Cause | Fix |
|---|---|
| Text typed inside a component | Move it to a content file, keyed by locale |
| Template string with a variable, or concatenation | Split it into plain strings around the variable |
| `array.join(...)` in a component | Render the items as elements, join with CSS |
| `.trim()`, `.toUpperCase()` or similar before render | Do it in CSS |
| A locale ternary (`locale === "en" ? "..." : "..."`) | Move the pair into a locale-keyed object |
| A content object declared inside a function | Hoist it to module scope |

Report what you left unfixed, with the reason. Do not restructure content that the author did not ask you to touch.

Two site-side conventions help:

- Language-switcher links should carry `hreflang`. They then keep working in Edit mode.
- Inline links inside copy should be written `[label](href)` in the string and rendered as anchors. reword then edits the paragraph as one piece.

## 6. Do not lose these

Each of these was a real bug while reword was built. The code handles them; keep them if you adapt it.

1. **Blur re-entrancy.** Removing or locking the editable span fires `focusout` synchronously, and the blur handler commits. The session is dropped from its ref before the DOM is touched, and the in-flight save promise is registered before the save runs.
2. **Out-of-order reads.** A refresh that started before a save can land after it. Each resource keeps a request counter and only the newest answer is used.
3. **React owns the page.** Nodes are never removed, replaced or wrapped. A text node is emptied and restored only if it is still empty.
4. **Scan timing.** The DOM scan pauses while a text is open and ignores mutations inside reword's own elements.
5. **Event isolation.** In Edit mode, pointer and click events on the page stop at `window` capture. Scrolling is not blocked. Key events are stopped only when they come from the editable span.
6. **Copy belongs to a locale.** Loaded copy is tagged with its locale and used only while the page is in that locale.
7. **One request at a time in the review sheet.** Revert and Send are disabled while either is in flight.
8. **A portal needs the attribute.** If you swap the native `<dialog>` for a component that renders in a portal, put `data-reword` on its overlay and content, or reword will block its own dialog.

## 7. Verify

Report the actual output of each check. Do not report a check you did not run.

**Tests.** If you kept the `*.test.ts` files, run them. All must pass.

**Production.** After a production build:

- the route table has no `/api/reword`;
- `grep -rl "data-reword" .next/static` returns nothing;
- `grep -rl "createSourceFile" .next/server` returns nothing.

**API**, with curl against the edit server:

| Request | Expected |
|---|---|
| `POST` without `Origin` | 403 |
| `POST` with a foreign `Origin` | 403 |
| `GET` with `Sec-Fetch-Site: cross-site` | 403 |
| `GET` with `Host: evil.test:3000` | 403 |
| `POST` with `Content-Type: text/plain` | 415 |
| Save with `file: "../../package.json"` | 404 |
| Save of a slug or another structural value | 403 |
| Save with a stale `before` | 409 |
| Valid save | 200, exactly one literal changed in `git diff` |

**Browser**, in every language:

1. Hover marks a text. A click opens it with the caret at the click point.
2. Enter saves, the page shows the new text without a reload, and `git diff` shows one changed literal.
3. Esc after typing saves nothing. Check `GET /api/reword/draft`, not only the page.
4. A click on another text saves the open one and opens the next.
5. A text inside a link or a button opens for editing, and the link does not navigate.
6. The language switcher works in Edit mode and the copy of the new language loads.
7. Review lists the edits. Revert restores the file and the page.
8. With `agent: "clipboard"`, Send shows the sentence and a Copy button.
9. No console error during the run, and every save answers 200.

Then do one real send on a one-word edit, with the author's agent, and confirm the pull request.

## 8. Tell the author

Finish with a short report: the commands (`npm run edit`, `npm run draft`), how many strings are editable per language, what is not editable and why, and which agent the handoff is set to.

## Other frameworks

The folder has two halves.

- **Framework-free:** `literals.ts`, `draft.ts`, `workspace.ts`, `agents.ts`, `guard.ts`, `schemas.ts`, `words.ts`, `client/targets.ts`, `client/surface.ts`. They need Node.js on the server and a DOM in the browser.
- **Next.js:** `next.ts` (the route gate), `routes.ts` (two `Request` to `Response` handlers), `Mount.tsx` (the build-time mount), and one import of `usePathname` in `client/Reword.tsx`.

To port: expose the two handlers in the dev server only, keep the request guard in front of them, load the client only in development, and keep the safety contract in the [README](README.md#safety) true. If you cannot prove that the write route is absent from production, do not ship the port.
