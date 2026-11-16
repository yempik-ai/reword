import Link from "next/link";
import { INLINE_LINK } from "@/reword/inline-links";

/**
 * Renders a content string that may hold markdown-style [label](href) links.
 * Content stays plain strings (editable, translatable, readable by agents)
 * and the page gets real anchors.
 */
export default function InlineLinks({ text, newTab }: { text: string; newTab: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE_LINK)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [, label, target] = match;
    parts.push(
      /^https?:\/\//.test(target) ? (
        <a key={key++} href={target} target="_blank" rel="noopener" className="inline-link">
          {label}
          <span className="sr-only">{newTab}</span>
        </a>
      ) : (
        <Link key={key++} href={target} className="inline-link">
          {label}
        </Link>
      )
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}
