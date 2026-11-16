"use client";

import { useEffect, useRef, useState } from "react";
import type { Draft, DraftChange } from "../draft";
import type { SendResult } from "../schemas";
import { diffWords } from "../words";
import type { Result } from "./api";
import { CHROME } from "./targets";

// The draft before it leaves: every edit as a word diff, one press to take
// an edit back, one press to hand everything to the agent. A native <dialog>:
// focus trap, Esc and the top layer come from the browser.

const SENT_KEY = "reword:sent";

/** Identifies a draft by all of its content, so "sent" stays true only until anything in it changes. */
const signature = (draft: Draft) =>
  JSON.stringify([draft.changes.map((c) => [c.file, c.path, c.before, c.after]), draft.other]);

function Change({ change, busy, onRevert }: { change: DraftChange; busy: boolean; onRevert: () => void }) {
  const waiting = change.counterparts.filter((c) => !c.edited).map((c) => c.locale.toUpperCase());
  const done = change.counterparts.filter((c) => c.edited).map((c) => c.locale.toUpperCase());
  return (
    <li className="rw-change">
      <div className="rw-change-head">
        <span className="rw-chip">{change.locale}</span>
        <span className="rw-change-where">
          {change.file.replace(/^.*\//, "")}:{change.line} › {change.path}
        </span>
        <button type="button" className="rw-small" disabled={busy} onClick={onRevert}>
          Revert
        </button>
      </div>
      <p className="rw-diff" lang={change.locale}>
        {diffWords(change.before, change.after).map((part, index, parts) =>
          part.kind === "same" ? (
            part.text
          ) : part.kind === "removed" ? (
            <del key={index}>{part.text}</del>
          ) : (
            // A word swapped for another has no space of its own between the two.
            <ins
              key={index}
              data-tight={parts[index - 1]?.kind === "removed" && /\S$/.test(parts[index - 1].text) ? "" : undefined}
            >
              {part.text}
            </ins>
          )
        )}
      </p>
      {(waiting.length > 0 || done.length > 0) && (
        <p className="rw-change-next">
          {waiting.length > 0 && `To translate: ${waiting.join(", ")}. `}
          {done.length > 0 && `Edited by you: ${done.join(", ")}.`}
        </p>
      )}
    </li>
  );
}

export default function ReviewDialog({
  isOpen,
  onOpenChange,
  draft,
  translates,
  onRevert,
  onSend,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  draft: Draft;
  /** False on a single-language site: the agent then only checks and publishes. */
  translates: boolean;
  onRevert: (change: DraftChange) => Promise<Result<unknown>>;
  onSend: () => Promise<Result<SendResult>>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<SendResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // One request at a time: a second press would act on a draft that is moving.
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (isOpen && !element.open) element.showModal();
    if (!isOpen && element.open) element.close();
  }, [isOpen]);

  const current = signature(draft);
  // Read when the sheet is open: it then renders in the browser only.
  const alreadySent = (sent ?? (isOpen ? sessionStorage.getItem(SENT_KEY) : null)) === current;

  const send = async () => {
    setBusy(true);
    setProblem(null);
    const result = await onSend();
    setBusy(false);
    if (!result.ok) {
      setProblem(result.error);
      return;
    }
    setOutcome(result.value);
    if (result.value.sent) {
      sessionStorage.setItem(SENT_KEY, current);
      setSent(current);
    }
  };

  const revert = async (change: DraftChange) => {
    setBusy(true);
    const result = await onRevert(change);
    setBusy(false);
    setProblem(result.ok ? null : result.error);
  };

  const copyPrompt = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
  };

  const count = draft.changes.length;
  const plan = translates
    ? "Your agent translates each edit into the other languages, runs the check and opens a pull request."
    : "Your agent runs the check and opens a pull request.";

  return (
    <dialog
      ref={dialog}
      {...{ [CHROME]: "review" }}
      className="rw-sheet"
      aria-labelledby="rw-sheet-title"
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === dialog.current) onOpenChange(false);
      }}
    >
      {isOpen && (
        <div className="rw-sheet-inner">
          <header className="rw-sheet-head">
            <div>
              <h2 id="rw-sheet-title" className="rw-sheet-title">
                Draft
              </h2>
              <p className="rw-meta">
                {count} {count === 1 ? "edit" : "edits"} in your working tree, not committed.
              </p>
            </div>
            <button type="button" className="rw-small" onClick={() => onOpenChange(false)}>
              Close
            </button>
          </header>
          <div className="rw-sheet-body">
            <ul className="rw-changes">
              {draft.changes.map((change) => (
                <Change
                  key={`${change.file}#${change.path}`}
                  change={change}
                  busy={busy}
                  onRevert={() => void revert(change)}
                />
              ))}
            </ul>
            {draft.other.length > 0 && (
              <p className="rw-meta rw-other">
                Also changed outside reword (your agent reads the diff): {draft.other.join(", ")}
              </p>
            )}
          </div>
          <footer className="rw-sheet-foot">
            {outcome && !outcome.sent ? (
              <div className="rw-manual">
                <p className="rw-meta">Paste this into your coding agent, in this project:</p>
                <pre className="rw-prompt">{outcome.prompt}</pre>
                <button type="button" className="rw-small" onClick={() => void copyPrompt(outcome.prompt)}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <>
                <p className="rw-meta" role="status">
                  {problem ??
                    (outcome?.sent
                      ? `Sent to ${outcome.via}. It is working on your draft now.`
                      : alreadySent
                        ? "Sent. Your agent is working on this draft."
                        : plan)}
                </p>
                <button
                  type="button"
                  className="rw-send"
                  disabled={busy || alreadySent || count + draft.other.length === 0}
                  onClick={() => void send()}
                >
                  {alreadySent ? "Sent" : "Send to agent"}
                </button>
              </>
            )}
          </footer>
        </div>
      )}
    </dialog>
  );
}
