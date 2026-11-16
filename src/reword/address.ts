// ---------------------------------------------------------------------------
// Addresses of copy: what a string literal is called inside its file, and
// where the same copy lives in another locale. Pure and free of the
// TypeScript compiler, so the browser can use it too (the playground).
// literals.ts parses files into these shapes; draft.ts compares them.
// ---------------------------------------------------------------------------

export type Segment = string | number;

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
export const EXTENSION = /\.[cm]?[jt]sx?$/;

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
