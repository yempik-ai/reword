// Markdown-style [label](href) links inside content strings: the one piece of
// inline markup reword understands. One definition for the renderer and for
// the matcher that needs the text a reader actually sees.

export const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** The content string as a reader sees it: every link reduced to its label. */
export function visibleText(text: string): string {
  return text.replace(INLINE_LINK, "$1");
}
