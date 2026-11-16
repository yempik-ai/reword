import type { RewordConfig } from "../config";
import { diffDraft, listCopy, PUBLISH_PROMPT, renderBrief, type ContentFiles, type CopyLiteral } from "../draft";
import { checkEdit, RewordError } from "../edit";
import {
  applyEdits,
  editKey,
  fromIndex,
  indexSchema,
  keepValid,
  PLAYGROUND_INDEX,
  playgroundEditSchema,
  recordEdit,
  type PlaygroundEdit,
} from "../playground";
import { editSchema } from "../schemas";
import type { Api, Result } from "./api";
import { restoreCopy, showCopy } from "./surface";
import { findTargets, type Target } from "./targets";

// ---------------------------------------------------------------------------
// The playground's backend: the same interface as the dev server's API, with
// the browser as the working tree. The last commit is the static index the
// build published; the visitor's edits live in localStorage and never leave
// the browser. Every answer comes from the same pure functions the dev server
// runs (checkEdit, listCopy, diffDraft, renderBrief), so the draft, the word
// diff and the brief are real, built from the visitor's own edits.
// ---------------------------------------------------------------------------

type Rules = Pick<RewordConfig, "locales" | "structuralKeys" | "check" | "forbid">;

const storedEdits = playgroundEditSchema.array();

const ok = <T,>(value: T): Result<T> => ({ ok: true, value });

/** Where a place on the page shows a saved edit: what it showed before, and what it shows now. */
type Shown = { target: Target; key: string; committed: string; shown: string };

export function createPlaygroundApi(basePath: string, rules: Rules): Api {
  // One store per site: a static host (GitHub Pages) puts many sites on one origin.
  const storeKey = `reword:playground:${basePath || "/"}`;
  const edit = editSchema(rules.forbid);
  const missing = { ok: false, error: `The playground has no index: build it with \`npm run playground\`.` } as const;

  /** Used when the browser refuses storage (a private window): edits then last until the tab closes. */
  let memory: PlaygroundEdit[] = [];
  let head: ContentFiles | null = null;
  let loading: Promise<ContentFiles | null> | null = null;

  const load = () =>
    (loading ??= fetch(`${basePath}/${PLAYGROUND_INDEX}`, { cache: "no-cache" })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: unknown) => {
        const parsed = indexSchema.safeParse(json);
        head = parsed.success ? fromIndex(parsed.data) : null;
        if (!head) loading = null;
        return head;
      })
      .catch(() => {
        loading = null;
        return null;
      }));

  const read = (): PlaygroundEdit[] => {
    let raw: string | null;
    try {
      raw = localStorage.getItem(storeKey);
    } catch {
      return memory;
    }
    try {
      const parsed = storedEdits.safeParse(JSON.parse(raw ?? "[]"));
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  };

  const write = (edits: PlaygroundEdit[]) => {
    memory = edits;
    try {
      if (edits.length > 0) localStorage.setItem(storeKey, JSON.stringify(edits));
      else localStorage.removeItem(storeKey);
    } catch {
      // Storage is off: `memory` holds the draft for this tab.
    }
  };

  /** The snapshots the draft functions read. Edits a new deploy made stale are dropped here. */
  const snapshot = async () => {
    const committed = await load();
    if (!committed) return null;
    const stored = read();
    const edits = keepValid(committed, stored);
    if (edits.length !== stored.length) write(edits);
    return { head: committed, edits, work: applyEdits(committed, edits) };
  };

  // Places on the page that show a saved edit, and the copy React rendered, per locale.
  const shown = new Map<Node, Shown>();
  const committedCopy = new Map<string, CopyLiteral[]>();

  return {
    kind: "playground",

    async fetchCopy(locale) {
      const state = await snapshot();
      return state ? ok({ literals: listCopy(rules, state.work, state.head, locale) }) : missing;
    },

    async saveEdit(input) {
      const state = await snapshot();
      if (!state) return missing;
      const parsed = edit.safeParse(input);
      if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid edit." };
      try {
        const literal = checkEdit(rules, state.work, state.head, parsed.data);
        write(recordEdit(state.head, state.edits, parsed.data));
        const order = [...(state.work.get(input.file)?.keys() ?? [])].indexOf(literal.path);
        return ok({
          literal: { locale: literal.locale, file: input.file, path: literal.path, value: parsed.data.after, line: literal.line, order },
        });
      } catch (error) {
        if (error instanceof RewordError) return { ok: false, error: error.message };
        throw error;
      }
    },

    async fetchDraft() {
      const state = await snapshot();
      return state ? ok(diffDraft(rules, state.head, state.work)) : missing;
    },

    async sendDraft() {
      const state = await snapshot();
      if (!state) return missing;
      const draft = diffDraft(rules, state.head, state.work);
      if (draft.changes.length === 0) return { ok: false, error: "The draft is empty: nothing to send." };
      return ok({ sent: false, prompt: PUBLISH_PROMPT, brief: renderBrief(draft, rules) });
    },

    present(root, locale) {
      if (!head) return;
      const edits = new Map(keepValid(head, read()).map((one) => [editKey(one), one]));

      // Places already showing an edit follow the draft: a new text, or React's own again after a revert.
      for (const [place, entry] of shown) {
        if (!place.isConnected) {
          shown.delete(place);
          continue;
        }
        const wanted = edits.get(entry.key)?.after ?? entry.committed;
        if (wanted === entry.committed) {
          restoreCopy(entry.target);
          shown.delete(place);
        } else if (wanted !== entry.shown) {
          showCopy(entry.target, wanted, basePath);
          entry.shown = wanted;
        }
      }
      if (edits.size === 0) return;

      // Places that still show what React rendered from the build: give them the visitor's text.
      let copy = committedCopy.get(locale);
      if (!copy) {
        copy = listCopy(rules, head, head, locale);
        committedCopy.set(locale, copy);
      }
      for (const target of findTargets(root, copy).list) {
        const place = target.text ?? target.element;
        const literal = target.candidates[0];
        const saved = edits.get(editKey(literal));
        if (!saved || shown.has(place)) continue;
        showCopy(target, saved.after, basePath);
        shown.set(place, { target, key: editKey(literal), committed: literal.value, shown: saved.after });
      }
    },
  };
}
