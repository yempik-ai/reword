"use client";

import type { Play } from "@/content/play";
import { ask } from "@/reword/client/events";
import type { DraftChange } from "@/reword/draft";
import { diffWords } from "@/reword/words";
import { useDraft, useMarks, useSession } from "./store";

// ---------------------------------------------------------------------------
// The proof desk, beside the headline: a ticket of four corrections to try,
// and the draft they make, live. Everything on it is read from reword's own
// events: the open text as it is typed, the draft as the editor reads it.
// Nothing here is staged.
// ---------------------------------------------------------------------------

/** Where each mark sends the keyboard: the text it asks you to change. */
const TARGET = { headline: "hero-title", typo: "hero-note", rule: "hero-lede" } as const;

const PLAYGROUND = process.env.NEXT_PUBLIC_REWORD_PLAYGROUND === "1";

const fileName = (file: string) => file.replace(/^.*\//, "");

/** The property a string sits under (`lede`), or nothing for an array item. */
const keyOf = (path: string) => /\.([A-Za-z_$][\w$]*)$/.exec(path)?.[1];

/** One side of a change, as the source line would read, with the words that moved marked. */
function SourceLine({ sign, path, before, after }: { sign: "-" | "+"; path: string; before: string; after: string }) {
  const key = keyOf(path);
  const parts = diffWords(before, after).filter((part) => part.kind !== (sign === "-" ? "added" : "removed"));
  return (
    <p className={`line line-${sign === "-" ? "out" : "in"}`}>
      <span className="line-sign" aria-hidden="true">
        {sign}
      </span>
      <span className="line-code">
        {key && `${key}: `}&quot;
        {parts.map((part, index) =>
          part.kind === "same" ? (
            JSON.stringify(part.text).slice(1, -1)
          ) : (
            <mark key={index}>{JSON.stringify(part.text).slice(1, -1)}</mark>
          )
        )}
        &quot;,
      </span>
    </p>
  );
}

function Change({ change }: { change: Pick<DraftChange, "file" | "line" | "path" | "before" | "after"> }) {
  return (
    <>
      <p className="hunk-where">
        {fileName(change.file)}:{change.line} <span aria-hidden="true">›</span> {change.path}
      </p>
      <SourceLine sign="-" path={change.path} before={change.before} after={change.after} />
      <SourceLine sign="+" path={change.path} before={change.before} after={change.after} />
    </>
  );
}

function Ticket({ t, typos }: { t: Play["ticket"]; typos: readonly string[] }) {
  const marks = useMarks(typos);
  const done = t.marks.filter((mark) => marks[mark.id]).length;

  const go = (id: keyof typeof marks) => {
    if (id === "send") return ask("reword:open-review", null);
    const element = document.getElementById(TARGET[id]);
    if (element) ask("reword:open-text", { element });
  };

  return (
    <section className="ticket" aria-labelledby="ticket-title">
      <header className="ticket-head">
        <h2 id="ticket-title">{t.title}</h2>
        <p className="ticket-count" aria-hidden="true">
          {done}/{t.marks.length}
        </p>
      </header>
      <p className="ticket-lede">{t.lede}</p>
      <ol className="marks">
        {t.marks.map((mark) => (
          <li key={mark.id} className="mark" data-done={marks[mark.id] ? "" : undefined}>
            <button type="button" className="mark-label" onClick={() => go(mark.id)}>
              {mark.label}
            </button>
            <p className="mark-note">{marks[mark.id] ? mark.done : mark.hint}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DraftPanel({ t }: { t: Play["draft"] }) {
  const draft = useDraft();
  const session = useSession();
  const changes = draft?.changes ?? [];
  // The open text is shown live above the saved edits; its own saved edit waits below it.
  const saved = changes.filter((change) => !session || change.file !== session.literal.file || change.path !== session.literal.path);
  const edited = session && changes.find((change) => change.file === session.literal.file && change.path === session.literal.path);

  return (
    // reword's own marker: the page echoes copy here, and the editor must not read it as copy.
    <section className="tree" aria-labelledby="tree-title" data-reword="echo">
      <header className="tree-head">
        <h2 id="tree-title">{t.title}</h2>
        <p className="tree-where">{PLAYGROUND ? t.inBrowser : t.inRepo}</p>
      </header>
      <div className="tree-body" aria-live="polite">
        {session && (
          <div className="hunk hunk-live" data-refused={session.error ? "" : undefined}>
            <p className="hunk-state">{session.error ? t.refused : t.typing}</p>
            <Change
              change={{
                file: session.literal.file,
                line: session.literal.line,
                path: session.literal.path,
                before: edited ? edited.before : session.literal.value,
                after: session.text,
              }}
            />
            {session.error && <p className="hunk-error">{session.error}</p>}
          </div>
        )}
        {saved.map((change) => (
          <div key={`${change.file}#${change.path}`} className="hunk">
            <Change change={change} />
          </div>
        ))}
        {!session && changes.length === 0 && <p className="tree-empty">{t.empty}</p>}
      </div>
      {changes.length > 0 && (
        <footer className="tree-foot">
          <p>
            {changes.length} {changes.length === 1 ? t.edit : t.edits}
          </p>
          <button type="button" onClick={() => ask("reword:open-review", null)}>
            {t.review}
          </button>
        </footer>
      )}
    </section>
  );
}

/** The desk: the ticket, then the draft it produces. `typos` holds the planted typo of every locale. */
export default function Desk({ play, typos }: { play: Play; typos: readonly string[] }) {
  return (
    <div className="desk">
      <Ticket t={play.ticket} typos={typos} />
      <DraftPanel t={play.draft} />
    </div>
  );
}
