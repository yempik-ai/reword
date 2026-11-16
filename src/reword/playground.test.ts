import { describe, expect, it } from "vitest";
import { STRUCTURAL_KEYS } from "./config.ts";
import { diffDraft, indexLiterals, listCopy, renderBrief, type ContentFiles } from "./draft.ts";
import { checkEdit, RewordError } from "./edit.ts";
import { parseLiterals } from "./literals.ts";
import { applyEdits, fromIndex, keepValid, recordEdit, toIndex, type PlaygroundEdit } from "./playground.ts";

const RULES = { locales: ["en", "it"] as const, structuralKeys: STRUCTURAL_KEYS, check: "npm run check" };
const PAGE = "src/content/page.ts";
const OTHER = "src/content/other.ts";

const parse = (file: string, source: string) => indexLiterals(parseLiterals(file, source, RULES.locales));

const head: ContentFiles = new Map([
  [
    PAGE,
    parse(
      PAGE,
      `export const page = {
  en: { slug: "home", title: "No prompt for a tpyo." },
  it: { slug: "home", title: "Niente prompt per un rfeuso." },
};`
    ),
  ],
  [OTHER, parse(OTHER, `export const other = { en: { a: "One" }, it: { a: "Uno" } };`)],
]);

const fix: PlaygroundEdit = { file: PAGE, path: "page.en.title", before: "No prompt for a tpyo.", after: "No prompt for a typo." };

describe("the playground index", () => {
  it("survives JSON: the browser reads the snapshot the build parsed", () => {
    expect(fromIndex(JSON.parse(JSON.stringify(toIndex(head))))).toEqual(head);
  });
});

describe("a draft in the browser", () => {
  it("is the real draft: the same diff, counterparts and brief as on the dev server", () => {
    const draft = diffDraft(RULES, head, applyEdits(head, [fix]));
    expect(draft).toEqual({
      changes: [
        {
          locale: "en",
          file: PAGE,
          path: "page.en.title",
          line: 2,
          before: "No prompt for a tpyo.",
          after: "No prompt for a typo.",
          counterparts: [
            { locale: "it", file: PAGE, path: "page.it.title", line: 3, value: "Niente prompt per un rfeuso.", edited: false },
          ],
        },
      ],
      other: [],
    });
    expect(renderBrief(draft, RULES)).toContain("> No prompt for a typo.");
  });

  it("leaves untouched files as they were committed", () => {
    const work = applyEdits(head, [fix]);
    expect(work.get(OTHER)).toBe(head.get(OTHER));
    expect(listCopy(RULES, work, head, "en").map((literal) => literal.value)).toEqual(["No prompt for a typo.", "One"]);
  });

  it("drops an edit whose text a new deploy changed, and keeps the others", () => {
    const stale: PlaygroundEdit = { file: OTHER, path: "other.en.a", before: "Once", after: "Twice" };
    const gone: PlaygroundEdit = { file: OTHER, path: "other.en.b", before: "x", after: "y" };
    expect(keepValid(head, [fix, stale, gone])).toEqual([fix]);
  });

  it("forgets an edit written back to the committed text, like a revert", () => {
    const edits = recordEdit(head, [], { file: PAGE, path: "page.en.title", before: fix.before, after: fix.after });
    expect(edits).toEqual([fix]);
    expect(recordEdit(head, edits, { file: PAGE, path: "page.en.title", before: fix.after, after: fix.before })).toEqual([]);
  });
});

describe("checkEdit", () => {
  const work = applyEdits(head, [fix]);
  const refusal = (edit: Parameters<typeof checkEdit>[3]) => {
    try {
      checkEdit(RULES, work, head, edit);
      return null;
    } catch (error) {
      return error instanceof RewordError ? error.code : error;
    }
  };

  it("refuses structure, a stale text and a new line in a single-line text", () => {
    expect(refusal({ file: PAGE, path: "page.en.slug", before: "home", after: "away" })).toBe("not_editable");
    expect(refusal({ file: PAGE, path: "page.en.title", before: fix.before, after: "Again." })).toBe("conflict");
    expect(refusal({ file: PAGE, path: "page.en.title", before: fix.after, after: "Two\nlines" })).toBe("invalid");
    expect(refusal({ file: PAGE, path: "page.en.nothing", before: "", after: "x" })).toBe("not_found");
  });

  it("accepts copy that still reads what the browser saw", () => {
    expect(refusal({ file: PAGE, path: "page.en.title", before: fix.after, after: "No prompt, ever." })).toBeNull();
  });
});
