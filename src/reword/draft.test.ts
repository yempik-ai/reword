import { describe, expect, it } from "vitest";
import { STRUCTURAL_KEYS } from "./config.ts";
import { diffDraft, indexLiterals, isCopy, listCopy, renderBrief, type ContentFiles } from "./draft.ts";
import { parseLiterals } from "./literals.ts";

const FILE = "src/content/sample.ts";
const MANY = { locales: ["it", "en", "pl"] as const, structuralKeys: STRUCTURAL_KEYS, check: "npm run check" };
const ONE = { locales: ["en"] as const, structuralKeys: STRUCTURAL_KEYS, check: "npm run check" };

const sample = (it: string, en = "Hello", pl = "Cześć") => `
export const page = {
  it: { slug: "same-slug", title: "${it}" },
  en: { slug: "same-slug", title: "${en}" },
  pl: { slug: "same-slug", title: "${pl}" },
};
`;

const snapshot = (source: string, locales: readonly string[] = MANY.locales): ContentFiles =>
  new Map([[FILE, indexLiterals(parseLiterals(FILE, source, locales))]]);

describe("isCopy, on a site with several languages", () => {
  const head = snapshot(sample("Ciao"));
  const copy = (work: ContentFiles, path: string) => isCopy(MANY, work, head, FILE, work.get(FILE)!.get(path)!);

  it("is what differs between locales", () => {
    expect(copy(head, "page.it.title")).toBe(true);
  });

  it("is not what every locale shares: structure and identity", () => {
    expect(copy(head, "page.it.slug")).toBe(false);
  });

  it("is not a string without a translation at the same address", () => {
    const lonely = snapshot(`export const page = { it: { title: "Ciao", extra: "Solo qui" }, en: { title: "Hello" }, pl: { title: "Cześć" } };`);
    expect(isCopy(MANY, lonely, lonely, FILE, lonely.get(FILE)!.get("page.it.extra")!)).toBe(false);
  });

  it("stays copy once it is in the draft, even when the locales now agree", () => {
    const work = snapshot(sample("Hello", "Hello", "Hello"));
    expect(copy(work, "page.it.title")).toBe(true);
    expect(copy(work, "page.en.title")).toBe(false);
  });

  it("lists one locale for the page index", () => {
    expect(listCopy(MANY, head, head, "en")).toEqual([
      { locale: "en", file: FILE, order: 3, path: "page.en.title", value: "Hello", line: 4 },
    ]);
  });
});

describe("isCopy, on a single-language site", () => {
  const source = `export const page = {
  slug: "about-me",
  title: "About me",
  href: "A label that sits under a structural key",
  cta: { label: "Write to me", target: "/contact" },
  published: "2026-11-16",
  mail: "me@example.com",
  site: "https://example.com",
  count: "42",
};`;
  const work = snapshot(source, ONE.locales);
  const copy = (path: string) => isCopy(ONE, work, work, FILE, work.get(FILE)!.get(path)!);

  it("opens prose", () => {
    expect(copy("page.title")).toBe(true);
    expect(copy("page.cta.label")).toBe(true);
  });

  it("keeps a structural value closed after someone changes it in the file", () => {
    const edited = snapshot(source.replace(`slug: "about-me"`, `slug: "about"`), ONE.locales);
    expect(isCopy(ONE, edited, work, FILE, edited.get(FILE)!.get("page.slug")!)).toBe(false);
    expect(diffDraft(ONE, work, edited)).toEqual({ changes: [], other: [FILE] });
  });

  it("keeps prose open after an edit that makes it look like structure", () => {
    const edited = snapshot(source.replace(`title: "About me"`, `title: "2026"`), ONE.locales);
    expect(isCopy(ONE, edited, work, FILE, edited.get(FILE)!.get("page.title")!)).toBe(true);
  });

  it("keeps structural keys and non-prose values closed", () => {
    for (const path of ["page.slug", "page.href", "page.cta.target", "page.published", "page.mail", "page.site", "page.count"]) {
      expect(copy(path), path).toBe(false);
    }
  });
});

describe("diffDraft", () => {
  const head = snapshot(sample("Ciao"));

  it("is empty when nothing changed", () => {
    expect(diffDraft(MANY, head, new Map(head))).toEqual({ changes: [], other: [] });
  });

  it("pairs an edit with the same copy in the other locales", () => {
    const { changes, other } = diffDraft(MANY, head, snapshot(sample("Salve", "Hello", "Hej")));
    expect(other).toEqual([]);
    expect(changes).toHaveLength(2);
    expect(changes[0]).toMatchObject({
      locale: "it",
      path: "page.it.title",
      before: "Ciao",
      after: "Salve",
      counterparts: [
        { locale: "en", path: "page.en.title", value: "Hello", edited: false },
        { locale: "pl", path: "page.pl.title", value: "Hej", edited: true },
      ],
    });
  });

  it("reports what the editor does not make, without guessing", () => {
    const grown = sample("Ciao").replace(`title: "Ciao"`, `title: "Ciao", extra: "nuovo"`);
    expect(diffDraft(MANY, head, snapshot(grown))).toEqual({ changes: [], other: [FILE] });
    expect(diffDraft(MANY, head, new Map())).toEqual({ changes: [], other: [FILE] });
  });
});

describe("renderBrief", () => {
  it("gives the agent the edit, its place, the copy to translate and the procedure", () => {
    const brief = renderBrief(diffDraft(MANY, snapshot(sample("Ciao")), snapshot(sample("Salve"))), MANY);
    expect(brief).toContain("1 copy edit in the working tree");
    expect(brief).toContain(`## 1. it · ${FILE}:3 · \`page.it.title\``);
    expect(brief).toContain("Before:\n> Ciao");
    expect(brief).toContain("After:\n> Salve");
    expect(brief).toContain(`- en · ${FILE}:4 · \`page.en.title\`\n  > Hello`);
    expect(brief).toContain("## Procedure");
    expect(brief).toContain("`npm run check`");
    expect(brief).toContain("3. Translate.");
  });

  it("asks for no translation on a single-language site", () => {
    const head = snapshot(`export const page = { title: "Hello" };`, ONE.locales);
    const work = snapshot(`export const page = { title: "Hi" };`, ONE.locales);
    const brief = renderBrief(diffDraft(ONE, head, work), ONE);
    expect(brief).toContain("After:\n> Hi");
    expect(brief).toContain("nothing to translate");
    expect(brief).not.toContain("Same copy in the other locales");
  });

  it("says so when there is nothing to publish", () => {
    expect(renderBrief({ changes: [], other: [] }, MANY)).toContain("No content edits");
  });
});
