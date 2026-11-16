import { describe, expect, it } from "vitest";
import { counterpartAddress, differsOnlyInLiterals, parseLiterals, replaceLiteral } from "./literals.ts";

const LOCALES = ["en", "it"];

const SOURCE = `import type { Essay } from "./types";

const LINK = "https://example.com";

const it: Essay[] = [
  { slug: "one", title: "Titolo", body: [{ t: "p", text: 'Con \\'apici\\' singoli' }, { t: "ul", items: ["a", \`b\`] }] },
];

export const ui = {
  it: { nav: { open: "Apri" }, computed: "a" + "b", linked: LINK, shout: \`ciao \${LINK}\`, "odd key": "x" },
  en: { nav: { open: "Open" } },
} as const satisfies Record<string, unknown>;

export function later() {
  return "not data";
}
`;

describe("parseLiterals", () => {
  const literals = parseLiterals("src/content/sample.ts", SOURCE, LOCALES);
  const byPath = new Map(literals.map((literal) => [literal.path, literal]));

  it("addresses plain data by its structure", () => {
    expect([...byPath.keys()]).toEqual([
      "LINK",
      "it[0].slug",
      "it[0].title",
      "it[0].body[0].t",
      "it[0].body[0].text",
      "it[0].body[1].t",
      "it[0].body[1].items[0]",
      "it[0].body[1].items[1]",
      "ui.it.nav.open",
      'ui.it["odd key"]',
      "ui.en.nav.open",
    ]);
  });

  it("leaves out everything computed", () => {
    expect(byPath.has("ui.it.computed")).toBe(false);
    expect(byPath.has("ui.it.linked")).toBe(false);
    expect(byPath.has("ui.it.shout")).toBe(false);
  });

  it("reads the locale from a variable, a key or the file name", () => {
    expect(byPath.get("LINK")?.locale).toBeNull();
    expect(byPath.get("it[0].title")?.locale).toBe("it");
    expect(byPath.get("ui.en.nav.open")?.locale).toBe("en");
    expect(parseLiterals("src/content/posts.it.ts", `export const postsIt = [{ title: "Titolo" }];`, LOCALES)[0].locale).toBe("it");
  });

  it("gives every literal to the one language of a single-language site", () => {
    const single = parseLiterals("src/content/sample.ts", SOURCE, ["en"]);
    expect(new Set(single.map((literal) => literal.locale))).toEqual(new Set(["en"]));
  });

  it("reads values and lines as the runtime sees them", () => {
    expect(byPath.get("it[0].body[0].text")).toMatchObject({ value: "Con 'apici' singoli", line: 6 });
  });

  it("reads JSX files and skips what is written inside components", () => {
    const tsx = `export const copy = { en: { title: "Hello" }, it: { title: "Ciao" } };
export function Page() { return <h1 className="big">Typed in the component</h1>; }`;
    expect(parseLiterals("src/app/page.tsx", tsx, LOCALES).map((literal) => literal.path)).toEqual([
      "copy.en.title",
      "copy.it.title",
    ]);
  });
});

describe("replaceLiteral", () => {
  const TRICKY = 'Dice "ciao" \\ e `poi` ${no} e \'basta\'. Żółć «ok»';

  it.each(["it[0].title", "it[0].body[0].text", "it[0].body[1].items[1]"])(
    "round-trips any text through %s and touches nothing else",
    (path) => {
      const before = parseLiterals("sample.ts", SOURCE, LOCALES);
      const target = before.find((literal) => literal.path === path)!;
      const next = replaceLiteral("sample.ts", SOURCE, target, TRICKY, LOCALES);
      const after = parseLiterals("sample.ts", next, LOCALES);

      expect(after.find((literal) => literal.path === path)?.value).toBe(TRICKY);
      expect(next.slice(0, target.start)).toBe(SOURCE.slice(0, target.start));
      expect(next.endsWith(SOURCE.slice(target.end))).toBe(true);
      expect(next[target.start]).toBe(SOURCE[target.start]); // same quote style
    }
  );

  it("keeps a line break inside a template literal", () => {
    const target = parseLiterals("sample.ts", SOURCE, LOCALES).find((l) => l.path === "it[0].body[1].items[1]")!;
    const next = replaceLiteral("sample.ts", SOURCE, target, "uno\ndue", LOCALES);
    expect(parseLiterals("sample.ts", next, LOCALES).find((l) => l.path === target.path)?.value).toBe("uno\ndue");
  });
});

describe("counterpartAddress", () => {
  it("swaps the locale segment inside one file", () => {
    const literal = parseLiterals("src/content/sample.ts", SOURCE, LOCALES).find((l) => l.path === "ui.it.nav.open")!;
    expect(counterpartAddress("src/content/sample.ts", literal, "en")).toEqual({
      file: "src/content/sample.ts",
      path: "ui.en.nav.open",
    });
  });

  it("swaps the file and the export name of per-locale files", () => {
    const [literal] = parseLiterals("src/content/posts.it.ts", `export const postsIt = [{ title: "Titolo" }];`, LOCALES);
    expect(counterpartAddress("src/content/posts.it.ts", literal, "en")).toEqual({
      file: "src/content/posts.en.ts",
      path: "postsEn[0].title",
    });
  });

  it.each([
    ["en", "it"],
    ["postsEn", "postsIt"],
    ["POSTS_EN", "POSTS_IT"],
    ["screen", "screen"],
    ["posts", "posts"],
  ])("maps the export %s of a per-locale file to %s", (name, expected) => {
    const [literal] = parseLiterals("src/content/posts.en.ts", `export const ${name} = [{ title: "Title" }];`, LOCALES);
    expect(counterpartAddress("src/content/posts.en.ts", literal, "it")?.path).toBe(`${expected}[0].title`);
  });

  it("has no counterpart for shared values", () => {
    const literal = parseLiterals("src/content/sample.ts", SOURCE, LOCALES).find((l) => l.path === "LINK")!;
    expect(counterpartAddress("src/content/sample.ts", literal, "en")).toBeNull();
  });
});

describe("differsOnlyInLiterals", () => {
  const before = `export const page = { en: { title: "Hello", order: 1 }, it: { title: "Ciao", order: 1 } };\n`;
  const only = (after: string) => differsOnlyInLiterals("sample.ts", before, after, LOCALES);

  it("accepts what the editor does: new text, any quote style", () => {
    expect(only(before)).toBe(true);
    expect(only(before.replace(`"Hello"`, `"Hi there"`))).toBe(true);
    expect(only(before.replace(`"Hello"`, "`Hi`"))).toBe(true);
  });

  it("notices everything else", () => {
    expect(only(before.replace("order: 1 }, it", "order: 2 }, it"))).toBe(false);
    expect(only(`// a comment\n${before}`)).toBe(false);
    expect(only(before.replace(`title: "Ciao"`, `title: "Ciao", extra: "x"`))).toBe(false);
  });
});
