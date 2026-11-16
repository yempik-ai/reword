import { z } from "zod";
import type { SourceLiteral } from "./address.ts";
import { indexLiterals, type ContentFiles } from "./draft.ts";
import type { Edit } from "./schemas.ts";

// ---------------------------------------------------------------------------
// Playground mode: reword on a public build, with the visitor's browser as
// the working tree. At build time the content files are parsed once into a
// static index (`npm run playground`, scripts/playground.ts). In the browser
// that index is the last commit, and the visitor's edits laid over it are the
// working tree: the same `listCopy`, `diffDraft` and `renderBrief` run on
// them as on the dev server. Pure: no IO, no TypeScript compiler.
// ---------------------------------------------------------------------------

/** Where the index is published, next to the site's other static files. */
export const PLAYGROUND_INDEX = "reword-copy.json";

const literalSchema = z.object({
  path: z.string(),
  locale: z.string().nullable(),
  value: z.string(),
  line: z.number(),
  segments: z.array(z.union([z.string(), z.number()])).readonly(),
  localeIndex: z.number(),
  start: z.number(),
  end: z.number(),
}) satisfies z.ZodType<SourceLiteral>;

/** The parsed content files, as JSON. Parsed again where it is read: it crosses the network. */
export const indexSchema = z.object({ files: z.record(z.string(), z.array(literalSchema)) });
export type PlaygroundIndex = z.infer<typeof indexSchema>;

/** One edit kept in the browser. `before` is the committed text it replaces. */
export const playgroundEditSchema = z.object({ file: z.string(), path: z.string(), before: z.string(), after: z.string() });
export type PlaygroundEdit = z.infer<typeof playgroundEditSchema>;

export const editKey = (literal: { file: string; path: string }) => `${literal.file}#${literal.path}`;

/** Parsed content files to the published index. */
export function toIndex(files: ContentFiles): PlaygroundIndex {
  return { files: Object.fromEntries([...files].map(([file, literals]) => [file, [...literals.values()]])) };
}

/** The published index to the snapshot the draft functions read: the last commit. */
export function fromIndex(index: PlaygroundIndex): ContentFiles {
  return new Map(Object.entries(index.files).map(([file, literals]) => [file, indexLiterals(literals)]));
}

/**
 * The edits that still apply to this index: their text must still be what
 * the build committed (compare-and-swap, as a save on the dev server). A
 * deploy that changed a sentence drops the edits made to its old text, and
 * keeps the rest.
 */
export function keepValid(head: ContentFiles, edits: readonly PlaygroundEdit[]): PlaygroundEdit[] {
  return edits.filter((edit) => {
    const committed = head.get(edit.file)?.get(edit.path);
    return committed !== undefined && committed.value === edit.before && edit.after !== edit.before;
  });
}

/** The working tree: the last commit with the edits laid over it. Untouched files keep their snapshot. */
export function applyEdits(head: ContentFiles, edits: readonly PlaygroundEdit[]): ContentFiles {
  const work = new Map(head);
  for (const edit of keepValid(head, edits)) {
    const literals = new Map(work.get(edit.file));
    const literal = literals.get(edit.path);
    if (!literal) continue;
    literals.set(edit.path, { ...literal, value: edit.after });
    work.set(edit.file, literals);
  }
  return work;
}

/**
 * The edits after one more save. An edit back to the committed text is no
 * edit: it leaves the list, as a revert leaves the git diff.
 */
export function recordEdit(head: ContentFiles, edits: readonly PlaygroundEdit[], edit: Edit): PlaygroundEdit[] {
  const committed = head.get(edit.file)?.get(edit.path);
  const rest = edits.filter((one) => editKey(one) !== editKey(edit));
  if (!committed || committed.value === edit.after) return rest;
  return [...rest, { file: edit.file, path: edit.path, before: committed.value, after: edit.after }];
}
