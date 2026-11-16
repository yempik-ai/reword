import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { RewordConfig } from "./config.ts";
import { diffDraft, indexLiterals, type ContentFiles, type CopyLiteral, type Draft } from "./draft.ts";
import { checkEdit, RewordError } from "./edit.ts";
import { differsOnlyInLiterals, parseLiterals, replaceLiteral } from "./literals.ts";
import type { Edit } from "./schemas.ts";

export { RewordError } from "./edit.ts";

// ---------------------------------------------------------------------------
// reword's IO: content files on disk and the last commit through git. Runs on
// the author's machine only (the dev server started by `npm run edit`, and
// `npm run draft`).
// ---------------------------------------------------------------------------

const run = promisify(execFile);

const SOURCE = /\.[cm]?[jt]sx?$/;
const NOT_CONTENT = /\.(test|spec)\.[cm]?[jt]sx?$|\.d\.[cm]?ts$/;

type Workspace = {
  /** The working tree. */
  work: ContentFiles;
  /** The last commit. Untouched files share the working tree's snapshot. */
  head: ContentFiles;
  sources: ReadonlyMap<string, string>;
  /** The committed text of every file that git reports as changed. */
  committed: ReadonlyMap<string, string>;
};

async function git(root: string, args: string[]): Promise<string> {
  const { stdout } = await run("git", args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  return stdout;
}

/** Parsed snapshots by source text: the page asks often, the files change rarely. */
const parsed = new Map<string, { source: string; literals: ReturnType<typeof indexLiterals> }>();

function parse(snapshot: "work" | "head", file: string, source: string, locales: readonly string[]) {
  const key = `${snapshot}:${locales.join(",")}:${file}`;
  const known = parsed.get(key);
  if (known?.source === source) return known.literals;
  const literals = indexLiterals(parseLiterals(file, source, locales));
  parsed.set(key, { source, literals });
  return literals;
}

const inside = (parent: string, child: string) => child.startsWith(parent + path.sep);

/**
 * Where a content file really is on disk, or `null` when a symbolic link
 * takes it outside its content folder. reword reads and writes only files
 * that are physically inside the folders the config names.
 */
async function physical(root: string, folders: readonly string[], file: string): Promise<string | null> {
  const folder = folders.find((one) => file.startsWith(`${one.replace(/\/+$/, "")}/`));
  if (!folder) return null;
  try {
    const base = await realpath(root);
    const home = await realpath(path.join(root, folder));
    const real = await realpath(path.join(root, file));
    return (home === base || inside(base, home)) && inside(home, real) ? real : null;
  } catch {
    return null;
  }
}

async function contentFiles(root: string, folders: readonly string[]): Promise<string[]> {
  const found = await Promise.all(
    folders.map(async (folder) => {
      const entries = await readdir(path.join(root, folder), { recursive: true }).catch(() => []);
      return entries
        .filter((entry) => SOURCE.test(entry) && !NOT_CONTENT.test(entry))
        .map((entry) => path.posix.join(folder, entry.split(path.sep).join("/")));
    })
  );
  const files = [...new Set(found.flat())].sort();
  const real = await Promise.all(files.map((file) => physical(root, folders, file)));
  return files.filter((_, index) => real[index] !== null);
}

/** The text of every content file, as it is on disk. No git: the playground index is built from this. */
export async function readSources(root: string, config: Pick<RewordConfig, "content">): Promise<Map<string, string>> {
  const files = await contentFiles(root, config.content);
  return new Map(
    await Promise.all(files.map(async (file) => [file, await readFile(path.join(root, file), "utf8")] as const))
  );
}

/** Reads the content files as they are on disk and as they were at the last commit. */
export async function readWorkspace(root: string, config: RewordConfig): Promise<Workspace> {
  const sources = await readSources(root, config);
  const files = [...sources.keys()];
  const work = new Map(files.map((file) => [file, parse("work", file, sources.get(file) ?? "", config.locales)]));

  const status = await git(root, [
    "status",
    "--porcelain",
    "--no-renames",
    "--untracked-files=all",
    "-z",
    "--",
    ...config.content,
  ]).catch(() => {
    throw new RewordError("no_git", "reword needs a git repository. Run `git init` and commit once.");
  });
  const changed = status
    .split("\0")
    .map((entry) => entry.slice(3))
    .filter((file) => SOURCE.test(file) && !NOT_CONTENT.test(file));
  const head = new Map(work);
  const committed = new Map<string, string>();
  await Promise.all(
    changed.map(async (file) => {
      const source = await git(root, ["show", `HEAD:${file}`]).catch(() => null);
      if (source === null) {
        head.delete(file);
      } else {
        committed.set(file, source);
        head.set(file, parse("head", file, source, config.locales));
      }
    })
  );
  return { work, head, sources, committed };
}

/** The pending draft: what differs between the last commit and the working tree. */
export async function readDraft(root: string, config: RewordConfig): Promise<Draft> {
  const { work, head, sources, committed } = await readWorkspace(root, config);
  const draft = diffDraft(config, head, work);
  // A file can change without any of its strings changing (a number, a
  // function, a comment). The editor never does that, so it is reported.
  const other = new Set(draft.other);
  for (const [file, before] of committed) {
    const after = sources.get(file);
    if (after !== undefined && !differsOnlyInLiterals(file, before, after, config.locales)) other.add(file);
  }
  return { changes: draft.changes, other: [...other].sort() };
}

async function write(root: string, config: RewordConfig, edit: Edit): Promise<CopyLiteral> {
  const { work, head, sources } = await readWorkspace(root, config);
  const literals = work.get(edit.file);
  const source = sources.get(edit.file);
  const target = literals && source !== undefined ? await physical(root, config.content, edit.file) : null;
  if (!literals || source === undefined || target === null) {
    throw new RewordError("not_found", "This text is no longer in the content files. Reload the page.");
  }
  const literal = checkEdit(config, work, head, edit);

  const next = replaceLiteral(edit.file, source, literal, edit.after, config.locales);

  // Written next to the file under a name nobody can predict, created only
  // if it does not exist, then moved into place: the swap is atomic.
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, next, { flag: "wx" });
    // Another writer (an editor, an agent) may have saved the file while we
    // worked. Its text wins: nothing of it is overwritten.
    if ((await readFile(target, "utf8")) !== source) {
      throw new RewordError("conflict", "This file changed on disk while saving. Reload the page.");
    }
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }

  return {
    locale: literal.locale,
    file: edit.file,
    path: literal.path,
    value: edit.after,
    line: literal.line,
    order: [...literals.keys()].indexOf(literal.path),
  };
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Replaces one piece of copy in its content file. Compare-and-swap on the
 * value the browser saw, the file read again just before the write, one
 * write at a time, atomic on disk.
 */
export function saveLiteral(root: string, config: RewordConfig, edit: Edit): Promise<CopyLiteral> {
  const result = queue.then(() => write(root, config, edit));
  queue = result.catch(() => undefined);
  return result;
}
