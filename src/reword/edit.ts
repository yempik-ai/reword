import type { SourceLiteral } from "./address.ts";
import type { RewordConfig } from "./config.ts";
import { isCopy, type ContentFiles } from "./draft.ts";
import type { Edit } from "./schemas.ts";

// ---------------------------------------------------------------------------
// What one edit may change. The same checks for the dev server, which then
// writes the file, and for the playground, which keeps the edit in the
// browser. Pure: no IO.
// ---------------------------------------------------------------------------

export type ErrorCode = "not_found" | "not_editable" | "conflict" | "invalid" | "empty" | "no_git";

/** A refusal the browser can show as it is. */
export class RewordError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Returns the literal an edit may replace, or throws the refusal: the text
 * must still exist, be copy (not structure), still read what the browser saw
 * (compare-and-swap), and stay on one line unless it has, or had at the last
 * commit, a line break.
 */
export function checkEdit(
  rules: Pick<RewordConfig, "locales" | "structuralKeys">,
  work: ContentFiles,
  head: ContentFiles,
  edit: Edit
): SourceLiteral & { locale: string } {
  const literal = work.get(edit.file)?.get(edit.path);
  if (!literal) throw new RewordError("not_found", "This text is no longer in the content files. Reload the page.");
  const { locale } = literal;
  if (locale === null || !isCopy(rules, work, head, edit.file, literal)) {
    throw new RewordError("not_editable", "This text is structure, not copy. Change it in the code.");
  }
  if (literal.value !== edit.before) {
    throw new RewordError("conflict", "This text changed since the page loaded. Reload the page.");
  }
  const lines = [literal.value, head.get(edit.file)?.get(edit.path)?.value ?? ""].some((text) => text.includes("\n"));
  if (edit.after.includes("\n") && !lines) throw new RewordError("invalid", "This text is a single line.");
  return { ...literal, locale };
}
