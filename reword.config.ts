import { defineConfig } from "./src/reword/config.ts";

export default defineConfig({
  // The languages of the site. One entry is fine: reword then skips translation.
  locales: ["en", "it"],
  // Where the copy lives.
  content: ["src/content"],
  // Who gets the draft: "auto" (T3 Code if installed, else a prompt to paste),
  // "t3", { t3: { provider, model } }, "clipboard", or any CLI:
  //   { command: "claude", args: ["-p", "{prompt}", "--permission-mode", "acceptEdits"] }
  //   { command: "codex", args: ["exec", "--full-auto", "{prompt}"] }
  agent: "auto",
  // What the agent runs before it commits.
  check: "npm run check",
  // House rules, refused while you type. This site writes without em dashes.
  forbid: [{ pattern: "\\u2014", message: "House style: no em dashes. Use a period, a colon or a comma." }],
});
