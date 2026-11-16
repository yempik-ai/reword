/** A stroke of pen that points at what to click. Decoration only. */
export function Scribble({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 34 30" aria-hidden="true">
      <path d="M3 4c12-1 21 5 23 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M18 17l8.5 6.5L31 13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The name, with the new word stuck over the old one: what the tool does. */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span className={["wordmark", className].filter(Boolean).join(" ")}>
      re
      <span className="wordmark-sticker">word</span>
    </span>
  );
}
