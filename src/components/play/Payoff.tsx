"use client";

import { useEffect, useRef, useState } from "react";
import type { Home } from "@/content/home";
import type { Play } from "@/content/play";
import { issueLink } from "@/lib/issue";
import type { SendDetail } from "@/reword/client/events";
import CopyButton from "../CopyButton";
import InstallBox from "../InstallBox";
import { flag } from "./store";

// ---------------------------------------------------------------------------
// Where the playground ends. "Send to agent" cannot start an agent from a
// browser, so reword hands the page what the agent would have read
// (`reword:send`), and the page shows it: the visitor's own edits as the real
// brief, what would happen next on their machine, and the two things they
// can actually do now: put reword on their site, or send this edit to us.
// Mounted in the layout, so it answers on every page. It also notes the one
// play mark only a live session can show: a house rule saying no.
// ---------------------------------------------------------------------------

const EM_DASH = /\u2014/;

type Props = { t: Play["payoff"]; install: Home["install"]; check: string; newTab: string };

export default function Payoff({ t, install, check, newTab }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [sent, setSent] = useState<SendDetail | null>(null);

  useEffect(() => {
    const listening = new AbortController();
    const { signal } = listening;
    window.addEventListener(
      "reword:send",
      (event) => {
        event.preventDefault();
        flag("send");
        setSent(event.detail);
      },
      { signal }
    );
    window.addEventListener(
      "reword:session",
      (event) => {
        if (event.detail?.error && EM_DASH.test(event.detail.text)) flag("rule");
      },
      { signal }
    );
    return () => listening.abort();
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (sent && element && !element.open) element.showModal();
  }, [sent]);

  const changes = sent?.draft.changes ?? [];
  const waiting = changes.flatMap((change) =>
    change.counterparts.filter((other) => !other.edited).map((other) => ({ ...other, key: `${other.file}#${other.path}` }))
  );
  const issue = sent ? issueLink(sent.draft) : null;

  return (
    <dialog
      ref={dialog}
      className="payoff"
      aria-labelledby="payoff-title"
      // reword's own marker: this sheet echoes the visitor's copy, and the editor must leave it alone.
      data-reword="echo"
      onClose={() => setSent(null)}
    >
      {sent && (
        <div className="payoff-sheet">
          <header className="payoff-head">
            <h2 id="payoff-title">{t.title}</h2>
            <p>{t.lede}</p>
            <button type="button" className="payoff-close" onClick={() => dialog.current?.close()}>
              {t.close}
            </button>
          </header>

          <section className="payoff-install" aria-labelledby="payoff-install">
            <h3 id="payoff-install">{t.install.title}</h3>
            <p>{t.install.text}</p>
            <InstallBox install={install} />
          </section>

          <div className="payoff-grid">
            <section className="payoff-brief" aria-labelledby="payoff-brief">
              <p id="payoff-brief" className="payoff-label">
                {t.brief}
              </p>
              <div className="terminal">
                <p className="terminal-command">
                  <span aria-hidden="true">$ </span>npm run draft
                </p>
                <pre tabIndex={0}>{sent.brief}</pre>
              </div>
            </section>

            <section className="payoff-next" aria-labelledby="payoff-next">
              <p id="payoff-next" className="payoff-label">
                {t.next}
              </p>
              <ol className="next">
                <li>
                  <h3>{t.translate.title}</h3>
                  {waiting.length > 0 ? (
                    <>
                      <p>{t.translate.text}</p>
                      <ul className="counterparts">
                        {waiting.map((other) => (
                          <li key={other.key}>
                            <span className="chip">{other.locale}</span>
                            <span className="counterpart-where">
                              {other.file.replace(/^.*\//, "")}:{other.line}
                            </span>
                            <q lang={other.locale}>{other.value}</q>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>{t.translated}</p>
                  )}
                </li>
                <li>
                  <h3>{t.check.title}</h3>
                  <p>{t.check.text}</p>
                  <code className="inline-code">{check}</code>
                </li>
                <li>
                  <h3>{t.pull.title}</h3>
                  <p>{t.pull.text}</p>
                </li>
              </ol>
              <p className="payoff-honest">{t.honest}</p>
            </section>
          </div>

          {issue && (
            <section className="payoff-us" aria-labelledby="payoff-us">
              <h3 id="payoff-us">{t.us.title}</h3>
              <p>{t.us.text}</p>
              <div className="payoff-us-actions">
                <a className="button" href={issue.url} target="_blank" rel="noopener">
                  {t.us.open}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only">{newTab}</span>
                </a>
                <CopyButton text={sent.brief} className="button button-quiet" label={t.us.copy} />
              </div>
              <p className="payoff-note">{issue.included < changes.length ? t.us.partial : t.us.note}</p>
            </section>
          )}
        </div>
      )}
    </dialog>
  );
}
