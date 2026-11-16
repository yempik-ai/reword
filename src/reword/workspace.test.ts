import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defineConfig } from "./config.ts";
import { readDraft, saveLiteral } from "./workspace.ts";

// The save against a real working tree: a throwaway git repository with one
// committed content file.

const FILE = "src/content/sample.ts";
const CONFIG = defineConfig({ locales: ["it", "en", "pl"] });
const SOURCE = `export const page = {
  it: { slug: "same", title: "Ciao", lines: \`uno
due\` },
  en: { slug: "same", title: "Hello", lines: \`one
two\` },
  pl: { slug: "same", title: "Cześć", lines: \`raz
dwa\` },
};
`;

let root: string;
const read = () => readFileSync(path.join(root, FILE), "utf8");
const edit = (target: string, before: string, after: string) =>
  saveLiteral(root, CONFIG, { file: FILE, path: target, before, after });

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "reword-"));
  mkdirSync(path.join(root, "src/content"), { recursive: true });
  writeFileSync(path.join(root, FILE), SOURCE);
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args],
      { cwd: root }
    );
  git("init", "--quiet");
  git("add", ".");
  git("commit", "--quiet", "--message", "content");
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("saveLiteral", () => {
  it("writes one value and the draft shows it", async () => {
    await expect(edit("page.it.title", "Ciao", "Salve")).resolves.toMatchObject({ locale: "it", value: "Salve" });
    expect(read()).toBe(SOURCE.replace(`"Ciao"`, `"Salve"`));

    const draft = await readDraft(root, CONFIG);
    expect(draft.other).toEqual([]);
    expect(draft.changes).toMatchObject([{ path: "page.it.title", before: "Ciao", after: "Salve" }]);
  });

  it("refuses when the file moved on since the page read it", async () => {
    await expect(edit("page.it.title", "Stale", "Salve")).rejects.toMatchObject({ code: "conflict" });
    expect(read()).toBe(SOURCE);
  });

  it("refuses structure and anything outside the content files", async () => {
    await expect(edit("page.it.slug", "same", "other")).rejects.toMatchObject({ code: "not_editable" });
    await expect(edit("page.it.missing", "x", "y")).rejects.toMatchObject({ code: "not_found" });
    await expect(
      saveLiteral(root, CONFIG, { file: "../outside.ts", path: "page.it.title", before: "Ciao", after: "x" })
    ).rejects.toMatchObject({ code: "not_found" });
    expect(read()).toBe(SOURCE);
  });

  it("keeps a single line single, and lets a text with lines keep them", async () => {
    await expect(edit("page.it.title", "Ciao", "Sal\nve")).rejects.toMatchObject({ code: "invalid" });
    await expect(edit("page.it.lines", "uno\ndue", "uno\ndue\ntre")).resolves.toMatchObject({ value: "uno\ndue\ntre" });
  });

  it("applies simultaneous saves one after the other", async () => {
    await Promise.all([edit("page.it.title", "Ciao", "Salve"), edit("page.en.title", "Hello", "Hi")]);
    expect(read()).toBe(SOURCE.replace(`"Ciao"`, `"Salve"`).replace(`"Hello"`, `"Hi"`));
  });

  it("takes an edit back to the committed text", async () => {
    await edit("page.it.title", "Ciao", "same");
    await edit("page.it.title", "same", "Ciao");
    expect(read()).toBe(SOURCE);
    expect(await readDraft(root, CONFIG)).toEqual({ changes: [], other: [] });
  });

  it("lets a text with lines go back to its lines after an edit joined them", async () => {
    await edit("page.it.lines", "uno\ndue", "uno due");
    await expect(edit("page.it.lines", "uno due", "uno\ndue")).resolves.toMatchObject({ value: "uno\ndue" });
    expect(read()).toBe(SOURCE);
  });

  it("does not follow a link that leaves the content folder", async () => {
    const outside = path.join(root, "outside.ts");
    writeFileSync(outside, SOURCE);
    symlinkSync(outside, path.join(root, "src/content/linked.ts"));
    await expect(
      saveLiteral(root, CONFIG, { file: "src/content/linked.ts", path: "page.it.title", before: "Ciao", after: "Salve" })
    ).rejects.toMatchObject({ code: "not_found" });
    expect(readFileSync(outside, "utf8")).toBe(SOURCE);
  });

  it("leaves no temporary file behind", async () => {
    await edit("page.it.title", "Ciao", "Salve");
    await expect(edit("page.it.title", "Stale", "x")).rejects.toMatchObject({ code: "conflict" });
    expect(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root }).toString()).toBe(
      ` M ${FILE}\n`
    );
  });

  it("reports changes that are not copy edits: code, and files not committed yet", async () => {
    writeFileSync(path.join(root, FILE), SOURCE.replace("export const page", "const VERSION = 2;\nexport const page"));
    mkdirSync(path.join(root, "src/content/new"), { recursive: true });
    writeFileSync(path.join(root, "src/content/new/extra.ts"), SOURCE);
    expect(await readDraft(root, CONFIG)).toEqual({ changes: [], other: ["src/content/new/extra.ts", FILE] });
  });

  it("says what is missing when the folder is not a git repository", async () => {
    rmSync(path.join(root, ".git"), { recursive: true, force: true });
    await expect(readDraft(root, CONFIG)).rejects.toMatchObject({ code: "no_git" });
  });
});
