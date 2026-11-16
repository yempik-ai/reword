import type { RewordConfig } from "./config.ts";
import { counterpartAddress, type Literal, type SourceLiteral } from "./literals.ts";

// ---------------------------------------------------------------------------
// The draft, derived. A draft is the set of copy values that differ between
// the last commit (head) and the working tree (work). Nothing is stored: git
// is the ledger, and this module only reads two snapshots of the content.
// Pure: no IO.
// ---------------------------------------------------------------------------

/** Parsed content files: file path, then literal path, in source order. */
export type ContentFiles = ReadonlyMap<string, ReadonlyMap<string, SourceLiteral>>;

/** A piece of copy the editor can change, as sent to the browser. */
export type CopyLiteral = Literal & {
  locale: string;
  file: string;
  /** Position among the file's literals: neighbours on the page are neighbours here. */
  order: number;
};

/** The same copy in another locale. */
export type Counterpart = {
  locale: string;
  file: string;
  path: string;
  line: number;
  value: string;
  /** True when this draft already changed it too. */
  edited: boolean;
};

export type DraftChange = {
  locale: string;
  file: string;
  path: string;
  line: number;
  before: string;
  after: string;
  counterparts: Counterpart[];
};

export type Draft = {
  changes: DraftChange[];
  /** Files that changed in ways the editor does not make: entries added or removed, shared values. */
  other: string[];
};

type Rules = Pick<RewordConfig, "locales" | "structuralKeys">;

export function indexLiterals(literals: readonly SourceLiteral[]): ReadonlyMap<string, SourceLiteral> {
  return new Map(literals.map((literal) => [literal.path, literal]));
}

function counterparts(
  rules: Rules,
  work: ContentFiles,
  head: ContentFiles,
  file: string,
  literal: SourceLiteral
): Counterpart[] {
  return rules.locales.flatMap((locale) => {
    if (locale === literal.locale) return [];
    const address = counterpartAddress(file, literal, locale);
    const found = address && work.get(address.file)?.get(address.path);
    if (!address || !found) return [];
    const committed = head.get(address.file)?.get(address.path);
    return [{ locale, ...address, line: found.line, value: found.value, edited: committed?.value !== found.value }];
  });
}

/** The same address in every other locale, inside one snapshot. */
function translations(rules: Rules, files: ContentFiles, file: string, literal: SourceLiteral): SourceLiteral[] {
  return rules.locales.flatMap((locale) => {
    const address = locale === literal.locale ? null : counterpartAddress(file, literal, locale);
    const found = address && files.get(address.file)?.get(address.path);
    return found ? [found] : [];
  });
}

const NOT_PROSE = [
  /^[a-z][a-z\d+.-]*:/i, // a URL or another scheme
  /^[/#.]/, // a path, an anchor, a relative file
  /^\d{4}-\d{2}-\d{2}/, // an ISO date
  /^[^\s@]+@[^\s@]+$/, // an e-mail address
];

/** Single-language sites: what a value and its property name say about it. */
function looksLikeProse(rules: Rules, literal: SourceLiteral): boolean {
  const key = literal.segments.findLast((segment) => typeof segment === "string");
  if (typeof key === "string" && rules.structuralKeys.includes(key)) return false;
  return /\p{L}/u.test(literal.value) && !NOT_PROSE.some((shape) => shape.test(literal.value));
}

/**
 * Copy is the text a reader reads and a writer rewrites.
 *
 * On a site with several languages the data says what copy is: a literal
 * inside a locale, with the same address in every other locale, whose text
 * differs in at least one of them. A value that is identical everywhere is
 * structure or identity (block types, slugs, dates, brand names) and stays
 * out of reach. No list of field names to keep up to date.
 *
 * A single-language site has no translation to compare with, so the rule is
 * a guess from the property name and the shape of the value. The check the
 * agent runs before it commits (types, build) is the second line there.
 *
 * What was copy at the last commit stays copy while it is in the draft, so
 * an edit can always be changed again or reverted, even when it made two
 * languages agree. A string that was structure does not become copy because
 * someone changed it in the file.
 */
export function isCopy(
  rules: Rules,
  work: ContentFiles,
  head: ContentFiles,
  file: string,
  literal: SourceLiteral
): boolean {
  if (literal.locale === null) return false;
  if (qualifies(rules, work, file, literal)) return true;
  const committed = head.get(file)?.get(literal.path);
  return committed !== undefined && committed.value !== literal.value && qualifies(rules, head, file, committed);
}

/** The rule itself, on one snapshot of the content. */
function qualifies(rules: Rules, files: ContentFiles, file: string, literal: SourceLiteral): boolean {
  if (rules.locales.length === 1) return looksLikeProse(rules, literal);
  const others = translations(rules, files, file, literal);
  return others.length === rules.locales.length - 1 && others.some((other) => other.value !== literal.value);
}

/** Every piece of copy of one locale, for the editor's page index. */
export function listCopy(rules: Rules, work: ContentFiles, head: ContentFiles, locale: string): CopyLiteral[] {
  const copy: CopyLiteral[] = [];
  for (const [file, literals] of work) {
    let order = 0;
    for (const literal of literals.values()) {
      if (literal.locale === locale && isCopy(rules, work, head, file, literal)) {
        copy.push({ locale, file, order, path: literal.path, value: literal.value, line: literal.line });
      }
      order += 1;
    }
  }
  return copy;
}

/** Compares the last commit with the working tree, literal by literal. */
export function diffDraft(rules: Rules, head: ContentFiles, work: ContentFiles): Draft {
  const changes: DraftChange[] = [];
  const other = new Set<string>();

  for (const file of head.keys()) if (!work.has(file)) other.add(file);

  for (const [file, literals] of work) {
    const committed = head.get(file);
    if (committed === literals) continue; // untouched file, same snapshot
    if (!committed) {
      other.add(file);
      continue;
    }
    if (committed.size !== literals.size || [...literals.keys()].some((path) => !committed.has(path))) other.add(file);

    for (const literal of literals.values()) {
      const before = committed.get(literal.path);
      if (!before || before.value === literal.value) continue;
      // A shared value, or structure someone changed in the file: not an edit to translate.
      if (literal.locale === null || !isCopy(rules, work, head, file, literal)) {
        other.add(file);
        continue;
      }
      changes.push({
        locale: literal.locale,
        file,
        path: literal.path,
        line: literal.line,
        before: before.value,
        after: literal.value,
        counterparts: counterparts(rules, work, head, file, literal),
      });
    }
  }
  return { changes, other: [...other].sort() };
}

function quote(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

/**
 * What the agent does with the draft. Printed under the brief, so the one
 * command `npm run draft` is all an agent needs: no skill file, no plugin,
 * any agent.
 */
function procedure(config: Pick<RewordConfig, "locales" | "check">): string {
  const translate =
    config.locales.length > 1
      ? [
          "3. Translate. For each edit, compare Before and After to see what the author changed, then change the same thing in the other locales at the `file:line` given. The author's text is final: do not polish the locale they edited. Change only what they changed and keep the rest of each translated string. Translate the meaning in the native voice of each language, not word by word. A fix that belongs to one language (a typo, grammar) changes nothing in the others. A counterpart marked \"already edited in this draft\" is the author's too: keep it. Inline links keep their `[label](href)` form.",
        ]
      : ["3. This is a single-language site: there is nothing to translate. Do not rewrite the author's text."];
  return [
    "## Procedure",
    "",
    "The author edited copy on the page with reword. Each edit is an uncommitted change to one string. Publish them.",
    "",
    "1. Work in this folder: the draft is uncommitted here, a fresh worktree does not have it. Read `AGENTS.md` or `CLAUDE.md` if the repository has one: its voice and brand rules apply to every string you write. If `git status` shows changes you cannot explain, stop and ask.",
    "2. Branch: `git switch -c copy/<short-topic>`. The uncommitted edits follow you.",
    ...translate,
    "4. \"Other content changes\" are edits the editor does not make. Read their diff and handle them under the rules of the repository.",
    `5. Check: \`${config.check}\`. It must pass, or nothing is committed. If the author's text is what breaks it, report that and wait.`,
    "6. Commit with explicit paths. If the repository has a remote, push and open a real pull request (not a draft): say what the author changed, then how each language carries it. Without a remote, leave the commit on the branch.",
    "7. Report each edit with the translations you wrote, so the author can check them in one read. Merging publishes the site: merge only when the author says so.",
  ].join("\n");
}

/** The draft as a brief for the agent that translates and publishes it. */
export function renderBrief(draft: Draft, config: Pick<RewordConfig, "locales" | "check">): string {
  const { changes, other } = draft;
  if (changes.length === 0 && other.length === 0) return "# reword draft\n\nNo content edits in the working tree.\n";

  const sections = changes.map((change, index) => {
    const translations = change.counterparts.map((c) =>
      [
        `- ${c.locale} · ${c.file}:${c.line} · \`${c.path}\`${c.edited ? " · already edited in this draft, keep it" : ""}`,
        quote(c.value).replace(/^/gm, "  "),
      ].join("\n")
    );
    return [
      `## ${index + 1}. ${change.locale} · ${change.file}:${change.line} · \`${change.path}\``,
      `Before:\n${quote(change.before)}`,
      `After:\n${quote(change.after)}`,
      ...(translations.length > 0 ? [`Same copy in the other locales:\n${translations.join("\n")}`] : []),
    ].join("\n\n");
  });

  const rest =
    other.length > 0
      ? [
          "## Other content changes",
          "These files changed in ways the editor does not make (entries added or removed, shared values). Read their diff:",
          other.map((file) => `- \`git diff HEAD -- ${file}\``).join("\n"),
        ].join("\n\n")
      : null;

  return (
    [
      "# reword draft",
      `${changes.length} copy ${changes.length === 1 ? "edit" : "edits"} in the working tree, each written by the author in the locale shown.`,
      ...sections,
      ...(rest ? [rest] : []),
      procedure(config),
    ].join("\n\n") + "\n"
  );
}
