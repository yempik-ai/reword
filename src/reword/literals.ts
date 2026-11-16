import ts from "typescript";

// ---------------------------------------------------------------------------
// reword's view of a content file: every string literal that sits in plain
// data (objects and arrays under a top-level declaration), with a structural
// address that stays the same while only values change.
// Pure: source text in, literals or new source text out. No IO.
// Relative imports carry the .ts extension so `node scripts/draft.ts` can run
// these modules without a bundler.
// ---------------------------------------------------------------------------

type Segment = string | number;

/** A string literal in a content file. */
export type Literal = {
  /** Address inside the file, e.g. `essays.en[0].body[3].text`. */
  path: string;
  /** The language this copy belongs to. `null` means shared by every locale. */
  locale: string | null;
  value: string;
  /** 1-based line of the literal, for humans and agents. */
  line: number;
};

/** A literal plus what is needed to rewrite it and to find its translations. */
export type SourceLiteral = Literal & {
  segments: readonly Segment[];
  /** Index of the locale segment in `segments`, or -1 when it is not in the address. */
  localeIndex: number;
  start: number;
  end: number;
};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const EXTENSION = /\.[cm]?[jt]sx?$/;

/** `["en", 0, "body", 3, "text"]` to `en[0].body[3].text`. */
export function formatPath(segments: readonly Segment[]): string {
  return segments
    .map((segment, index) => {
      if (typeof segment === "number") return `[${segment}]`;
      if (!IDENTIFIER.test(segment)) return `[${JSON.stringify(segment)}]`;
      return index === 0 ? segment : `.${segment}`;
    })
    .join("");
}

/** The locale in a file name such as `posts.it.ts`, if any. */
function fileLocale(file: string, locales: readonly string[]): string | null {
  const name = file.replace(EXTENSION, "");
  return locales.find((locale) => name.endsWith(`.${locale}`)) ?? null;
}

function unwrap(node: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node)
  ) {
    node = node.expression;
  }
  return node;
}

function propertyKey(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

/**
 * Lists the string literals of a content file in source order. Only plain
 * data is followed: anything computed (calls, concatenation, templates with
 * substitutions, references to other constants, JSX) is left out, so every
 * literal returned can be rewritten in place without changing how the file
 * runs.
 *
 * The locale of a literal comes from the file name (`posts.it.ts`) or from
 * the first segment of its address that names a locale (`ui.it.nav.open`).
 * On a single-language site every literal belongs to that one language.
 */
export function parseLiterals(file: string, source: string, locales: readonly string[]): SourceLiteral[] {
  const kind = /\.[cm]?[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, kind);
  const only = locales.length === 1 ? locales[0] : null;
  const ownLocale = only ?? fileLocale(file, locales);
  const literals: SourceLiteral[] = [];

  const visit = (expression: ts.Expression, segments: readonly Segment[]): void => {
    const node = unwrap(expression);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const localeIndex = ownLocale ? -1 : segments.findIndex((s) => typeof s === "string" && locales.includes(s));
      const localeSegment = segments[localeIndex];
      const start = node.getStart(sourceFile);
      literals.push({
        path: formatPath(segments),
        locale: ownLocale ?? (typeof localeSegment === "string" ? localeSegment : null),
        value: node.text,
        line: sourceFile.getLineAndCharacterOfPosition(start).line + 1,
        segments,
        localeIndex,
        start,
        end: node.getEnd(),
      });
    } else if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = propertyKey(property.name);
        if (key !== null) visit(property.initializer, [...segments, key]);
      }
    } else if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach((element, index) => {
        if (!ts.isSpreadElement(element)) visit(element, [...segments, index]);
      });
    }
  };

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        visit(declaration.initializer, [declaration.name.text]);
      }
    }
  }
  return literals;
}

function quoteLiteral(value: string, quote: string): string {
  // JSON string syntax is valid JavaScript and keeps non-ASCII text readable.
  if (quote === '"') return JSON.stringify(value);
  if (quote === "'") {
    return `'${JSON.stringify(value).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;
  }
  return `\`${value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\``;
}

/**
 * Returns `source` with one literal's value replaced, keeping its quote style
 * and every other byte of the file. Throws if the result does not parse back
 * to exactly the same literals with exactly this one value changed.
 */
export function replaceLiteral(
  file: string,
  source: string,
  literal: SourceLiteral,
  value: string,
  locales: readonly string[]
): string {
  const next = source.slice(0, literal.start) + quoteLiteral(value, source[literal.start]) + source.slice(literal.end);
  const before = parseLiterals(file, source, locales);
  const after = parseLiterals(file, next, locales);
  const intact =
    before.length === after.length &&
    before.every((b, i) => b.path === after[i].path && after[i].value === (b.path === literal.path ? value : b.value));
  if (!intact) throw new Error(`Rewriting ${file} ${literal.path} would change more than its value`);
  return next;
}

/**
 * True when two versions of a file differ only in the text of their string
 * literals: what the editor does. Anything else (an entry added, a number, a
 * comment, a function) was changed some other way.
 */
export function differsOnlyInLiterals(file: string, before: string, after: string, locales: readonly string[]): boolean {
  const old = parseLiterals(file, before, locales);
  const now = parseLiterals(file, after, locales);
  if (old.length !== now.length || old.some((literal, index) => literal.path !== now[index].path)) return false;
  let rebuilt = "";
  let cursor = 0;
  old.forEach((literal, index) => {
    rebuilt += before.slice(cursor, literal.start) + after.slice(now[index].start, now[index].end);
    cursor = literal.end;
  });
  return rebuilt + before.slice(cursor) === after;
}

/**
 * The name a per-locale file gives its export, in another locale: `en` to
 * `it`, `postsEn` to `postsIt`, `POSTS_EN` to `POSTS_IT`. Any other name is
 * the same in every locale file and stays as it is.
 */
function localeName(name: string, from: string, to: string): string {
  const capital = (locale: string) => locale[0].toUpperCase() + locale.slice(1);
  if (name === from) return to;
  if (name.endsWith(capital(from)) && /[a-z\d]/.test(name.at(-from.length - 1) ?? "")) {
    return name.slice(0, -from.length) + capital(to);
  }
  if (name.endsWith(`_${from.toUpperCase()}`)) return name.slice(0, -from.length) + to.toUpperCase();
  return name;
}

/** Where the same piece of copy lives in another locale, if the files are parallel. */
export function counterpartAddress(
  file: string,
  literal: SourceLiteral,
  locale: string
): { file: string; path: string } | null {
  if (literal.locale === null) return null;
  const segments = [...literal.segments];
  if (literal.localeIndex >= 0) {
    segments[literal.localeIndex] = locale;
    return { file, path: formatPath(segments) };
  }
  // Per-locale files (posts.it.ts) often export per-locale names (postsIt).
  const root = segments[0];
  if (typeof root === "string") segments[0] = localeName(root, literal.locale, locale);
  const extension = EXTENSION.exec(file)?.[0] ?? "";
  const base = file.slice(0, file.length - extension.length);
  return { file: `${base.slice(0, -literal.locale.length)}${locale}${extension}`, path: formatPath(segments) };
}
