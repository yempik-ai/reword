/** The proofreader's caret: the mark that says "insert here". Decoration only. */
export function Caret({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 8" aria-hidden="true">
      <path d="M1 7 6 1.5 11 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The name with the caret in it. */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span className={["wordmark", className].filter(Boolean).join(" ")}>
      re
      <Caret className="wordmark-caret" />
      word
    </span>
  );
}
