"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { ForbiddenPattern } from "../config";
import type { CopyLiteral, Draft, DraftChange } from "../draft";
import { copySchema } from "../schemas";
import { createApi } from "./api";
import ReviewDialog from "./ReviewDialog";
import { openSurface, type Surface } from "./surface";
import { CHROME, findTargets, hitTest, type Target, type Targets } from "./targets";
import "./reword.css";

// ---------------------------------------------------------------------------
// reword on the page: edit the site's copy where it is, in any locale.
// Mounted only by `npm run edit` (see Mount.tsx). In Edit mode the page is a
// document: clicks edit text, links and buttons stand still. A save goes
// straight into the content files, so the draft is the working tree and git
// is its ledger. "Send to agent" hands the draft over for translation and
// publishing.
//
// The only framework import is `usePathname`: a text left open is dropped
// when the route changes.
// ---------------------------------------------------------------------------

type Session = {
  target: Target;
  /** The literal being edited: one of `target.candidates`. */
  literal: CopyLiteral;
  surface: Surface;
  error: string | null;
};

type Props = { locales: readonly string[]; forbid: readonly ForbiddenPattern[]; basePath: string };

const MODE_KEY = "reword:edit";
const MODE_EVENT = "reword:mode";
const HOVER = "reword-hover";
const NOTICE_MS = 3200;
const EMPTY_DRAFT: Draft = { changes: [], other: [] };
const NO_COPY: readonly CopyLiteral[] = [];
const POINTER_EVENTS = ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "dblclick", "auxclick"] as const;
/**
 * What keeps working in Edit mode: the site's language switcher (links that
 * carry `hreflang`), and anything the site marks with `data-reword-pass`.
 */
const PASS = "a[hreflang], [data-reword-pass]";

function subscribeMode(onChange: () => void) {
  window.addEventListener(MODE_EVENT, onChange);
  return () => window.removeEventListener(MODE_EVENT, onChange);
}

const readMode = () => sessionStorage.getItem(MODE_KEY) === "1";

function writeMode(on: boolean) {
  sessionStorage.setItem(MODE_KEY, on ? "1" : "0");
  window.dispatchEvent(new Event(MODE_EVENT));
}

/** The page says which language it is in: `<html lang>`. */
function subscribeLang(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}

const readLang = () => document.documentElement.lang.toLowerCase();

/** Where an event happened: in the text being edited, in something that keeps working, or on the page. */
function zone(target: EventTarget | null): "surface" | "chrome" | "page" {
  if (!(target instanceof Element)) return "page";
  const chrome = target.closest(`[${CHROME}]`);
  if (chrome) return chrome.getAttribute(CHROME) === "surface" ? "surface" : "chrome";
  return target.closest(PASS) ? "chrome" : "page";
}

/** Marks the copy under the pointer without touching the page (CSS Custom Highlight API). */
function mark(target: Target | null) {
  if (target) CSS.highlights.set(HOVER, new Highlight(target.range));
  else CSS.highlights.delete(HOVER);
  document.documentElement.toggleAttribute("data-reword-hover", target !== null);
}

/** What was typed, without what the browser or a paste adds around it. */
function tidy(typed: string, original: string): string {
  const text = original.includes("\n") ? typed : typed.replace(/\s*\n\s*/g, " ");
  return original === original.trim() ? text.trim() : text;
}

const fileName = (file: string) => file.replace(/^.*\//, "");
const sameLiteral = (a: CopyLiteral, b: CopyLiteral) => a.file === b.file && a.path === b.path;

export default function Reword({ locales, forbid, basePath }: Props) {
  const pathname = usePathname();
  const schema = useMemo(() => copySchema(forbid), [forbid]);
  const api = useMemo(() => createApi(basePath), [basePath]);

  const lang = useSyncExternalStore(subscribeLang, readLang, () => "");
  const locale =
    locales.find((one) => one.toLowerCase() === lang) ??
    locales.find((one) => lang.startsWith(`${one.toLowerCase()}-`)) ??
    (locales.length === 1 ? locales[0] : null);

  const editing = useSyncExternalStore(subscribeMode, readMode, () => false);
  // The copy of one locale. After a locale switch the old copy is not this page's.
  const [copy, setCopy] = useState<{ locale: string; literals: readonly CopyLiteral[] } | null>(null);
  const literals = copy?.locale === locale ? copy.literals : NO_COPY;
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  // Event listeners read these: the session and the targets as they are now.
  const sessionRef = useRef<Session | null>(null);
  const targetsRef = useRef<Targets | null>(null);
  const hoverRef = useRef<Target | null>(null);
  const finishing = useRef<Promise<boolean> | null>(null);
  /** Counts clicks on the page: only the newest one may open a text. */
  const clicks = useRef(0);

  const update = (next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
  };

  // Reads overlap (window focus, a save, a revert). Only the answer to the
  // newest request is kept, so an older read can never undo a newer one.
  const newest = useRef({ copy: 0, draft: 0 });

  const loadCopy = useCallback(async (of: string) => {
    const request = ++newest.current.copy;
    const result = await api.fetchCopy(of);
    if (request !== newest.current.copy) return;
    if (result.ok) setCopy({ locale: of, literals: result.value.literals });
    else setNotice(result.error);
  }, [api]);

  const loadDraft = useCallback(async () => {
    const request = ++newest.current.draft;
    const result = await api.fetchDraft();
    if (request === newest.current.draft && result.ok) setDraft(result.value);
  }, [api]);

  // The content files can change behind the page (the agent commits, a file
  // is edited by hand): read them again whenever the window is back in front.
  useEffect(() => {
    const refresh = () => {
      void loadDraft();
      if (locale) void loadCopy(locale);
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [locale, loadCopy, loadDraft]);

  useEffect(() => {
    if (notice === null) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Keep the targets in step with the page. Paused while a text is open: the
  // page then holds our surface, and it is read again as soon as it closes.
  useEffect(() => {
    if (!editing) {
      targetsRef.current = null;
      return;
    }
    let frame = 0;
    const scan = () => {
      frame = 0;
      if (!sessionRef.current) targetsRef.current = findTargets(document.body, literals);
    };
    const observer = new MutationObserver((records) => {
      const onPage = records.some((record) => {
        const element = record.target instanceof Element ? record.target : record.target.parentElement;
        return !element?.closest(`[${CHROME}]`);
      });
      if (onPage) frame ||= requestAnimationFrame(scan);
    });
    scan();
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [editing, literals]);

  const begin = (target: Target, point: { x: number; y: number }) => {
    hoverRef.current = null;
    mark(null);
    const literal = target.candidates[0];
    update({ target, literal, surface: openSurface(target, literal.value, point), error: null });
  };

  /**
   * Ends the open text. The session is dropped first: taking the surface out
   * of the page blurs it, and that blur must find nothing left to save.
   */
  const end = (saved?: string) => {
    const open = sessionRef.current;
    update(null);
    open?.surface.close(saved);
  };

  const save = async (): Promise<boolean> => {
    const open = sessionRef.current;
    if (!open) return true;
    const { literal, surface } = open;
    const after = tidy(surface.read(), literal.value);
    if (after === literal.value) {
      end();
      return true;
    }
    const refuse = (error: string) => {
      // Esc during the save closed the text: there is no surface to act on.
      const current = sessionRef.current?.surface === surface ? sessionRef.current : null;
      surface.node.toggleAttribute("data-invalid", true);
      if (current) update({ ...current, error });
      return false;
    };
    const checked = schema.safeParse(after);
    if (!checked.success) return refuse(checked.error.issues[0].message);

    surface.lock(true);
    const saved = await api.saveEdit({ file: literal.file, path: literal.path, before: literal.value, after });
    if (!saved.ok) {
      surface.lock(false);
      return refuse(saved.error);
    }
    newest.current.copy += 1; // a read still on its way predates this save
    setCopy(
      (all) =>
        all && { ...all, literals: all.literals.map((one) => (sameLiteral(one, literal) ? saved.value.literal : one)) }
    );
    if (sessionRef.current?.surface === surface) end(after);
    setNotice("Saved to " + fileName(literal.file));
    await loadDraft();
    return true;
  };

  /**
   * Saves the open text. Resolves to `true` once no text is open any more.
   * One save at a time: it starts on the next microtask, after it is
   * registered here, because the save itself blurs the surface and that blur
   * asks to commit again.
   */
  const commit = (): Promise<boolean> => {
    finishing.current ??= Promise.resolve()
      .then(save)
      .finally(() => {
        finishing.current = null;
      });
    return finishing.current;
  };

  const setMode = async (on: boolean) => {
    if (!on && !(await commit())) return;
    writeMode(on);
  };

  const choose = (key: string) => {
    const open = sessionRef.current;
    const literal = open?.target.candidates.find((candidate) => `${candidate.file}#${candidate.path}` === key);
    // Not while a save is on its way: it carries the destination it started with.
    if (!open || !literal || finishing.current) return;
    // What was typed stays: only its destination changes.
    if (open.surface.read() === open.literal.value) open.surface.load(literal.value);
    update({ ...open, literal, error: null });
  };

  /** Opens the review sheet on the whole draft: the text still open is saved first. */
  const review = async () => {
    if (await commit()) setReviewing(true);
  };

  const revert = async (change: DraftChange) => {
    const result = await api.saveEdit({ file: change.file, path: change.path, before: change.after, after: change.before });
    await Promise.all([loadDraft(), locale ? loadCopy(locale) : null]);
    return result;
  };

  const onPointer = useEffectEvent(async (event: MouseEvent) => {
    const where = zone(event.target);
    if (where === "chrome") return;
    // The page's own handlers (React, the router, widgets) never see it.
    event.stopPropagation();
    if (where === "surface" || event.type !== "click") return;
    event.preventDefault();
    const targets = targetsRef.current;
    if (!targets || !(event.target instanceof Element)) return;
    const hit = hitTest(targets, event.target, event.clientX, event.clientY);
    const click = ++clicks.current;
    // A click outside an open text first saves it (the blur started that).
    // Several clicks can wait on one save: only the last of them goes on.
    if (!(await commit()) || click !== clicks.current || sessionRef.current) return;
    if (hit === "text") setNotice("Not copy: structure, shared by every language, or built in code.");
    else if (hit) begin(hit, { x: event.clientX, y: event.clientY });
  });

  const onMove = useEffectEvent((event: PointerEvent) => {
    const targets = targetsRef.current;
    const over =
      targets && !sessionRef.current && zone(event.target) === "page" && event.target instanceof Element
        ? hitTest(targets, event.target, event.clientX, event.clientY)
        : null;
    const target = over === "text" ? null : over;
    if (target === hoverRef.current) return;
    hoverRef.current = target;
    mark(target);
  });

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (zone(event.target) !== "surface") return;
    event.stopPropagation();
    if (event.type !== "keydown" || event.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      end();
    } else if (event.key === "Enter") {
      if (event.shiftKey && sessionRef.current?.literal.value.includes("\n")) return;
      event.preventDefault();
      void commit();
    }
  });

  const onFocusOut = useEffectEvent((event: FocusEvent) => {
    if (zone(event.target) !== "surface") return;
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest(`[${CHROME}]`)) return;
    void commit();
  });

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== "e" || !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void setMode(!editing);
  });

  // While typing, say at once what a save would refuse (the house rules).
  const onInput = useEffectEvent((event: Event) => {
    const open = sessionRef.current;
    if (!open || zone(event.target) !== "surface") return;
    const checked = schema.safeParse(tidy(open.surface.read(), open.literal.value));
    const error = checked.success ? null : checked.error.issues[0].message;
    if (error === open.error) return;
    open.surface.node.toggleAttribute("data-invalid", error !== null);
    update({ ...open, error });
  });

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => onShortcut(event);
    window.addEventListener("keydown", shortcut, true);
    return () => window.removeEventListener("keydown", shortcut, true);
  }, []);

  // Capture on window: reword decides before the page hears anything.
  useEffect(() => {
    if (!editing) return;
    const listening = new AbortController();
    const options = { capture: true, signal: listening.signal };
    for (const type of POINTER_EVENTS) window.addEventListener(type, (event) => void onPointer(event), options);
    for (const type of ["keydown", "keyup", "keypress"] as const) {
      window.addEventListener(type, (event) => onKey(event), options);
    }
    window.addEventListener("pointermove", (event) => onMove(event), { ...options, passive: true });
    window.addEventListener("focusout", (event) => onFocusOut(event), options);
    window.addEventListener("input", (event) => onInput(event), options);
    return () => {
      listening.abort();
      hoverRef.current = null;
      mark(null);
    };
  }, [editing]);

  // A text left open belongs to the page it was on.
  useEffect(
    () => () => {
      const open = sessionRef.current;
      sessionRef.current = null;
      setSession(null);
      open?.surface.close();
    },
    [pathname]
  );

  const edits = draft.changes.length;
  const pending = edits > 0 || draft.other.length > 0;
  const ready = copy?.locale === locale;
  const idle = !editing
    ? ""
    : locale === null
      ? "Set <html lang> to one of your locales"
      : ready
        ? "Click a text to edit it"
        : "Reading the copy";

  return (
    <>
      <section {...{ [CHROME]: "bar" }} className="rw-bar" aria-label="reword">
        {session && (
          <div className="rw-session" onMouseDown={(event) => event.preventDefault()}>
            <p className="rw-where">
              {fileName(session.literal.file)}:{session.literal.line} <span aria-hidden="true">›</span>{" "}
              {session.literal.path}
            </p>
            {session.target.candidates.length > 1 && (
              <fieldset className="rw-places">
                <legend>Same words in {session.target.candidates.length} places. Editing:</legend>
                {session.target.candidates.map((candidate) => {
                  const key = `${candidate.file}#${candidate.path}`;
                  return (
                    <label key={key} className="rw-place">
                      <input
                        type="radio"
                        name="rw-place"
                        value={key}
                        checked={sameLiteral(candidate, session.literal)}
                        onChange={() => choose(key)}
                      />
                      {fileName(candidate.file)} › {candidate.path}
                    </label>
                  );
                })}
              </fieldset>
            )}
            {session.error ? (
              <p className="rw-error" role="alert">
                {session.error}
              </p>
            ) : (
              <p className="rw-keys" aria-hidden="true">
                <kbd>↵</kbd> save <kbd>esc</kbd> cancel
              </p>
            )}
          </div>
        )}
        <div className="rw-controls">
          <div className="rw-mode" role="group" aria-label="Mode (Cmd+E)">
            <button type="button" aria-pressed={!editing} onClick={() => void setMode(false)}>
              Browse
            </button>
            <button type="button" aria-pressed={editing} onClick={() => void setMode(true)}>
              Edit
            </button>
          </div>
          {locale !== null && locales.length > 1 && (
            <span className="rw-locale" title="The language you are editing. Switch it with your site's own language links.">
              {locale}
            </span>
          )}
          <p className="rw-status" role="status">
            {notice ?? (session ? "" : idle)}
          </p>
          <button type="button" className="rw-review" disabled={!pending} onClick={() => void review()}>
            {edits > 0 ? `Review ${edits} ${edits === 1 ? "edit" : "edits"}` : pending ? "Review draft" : "No edits yet"}
          </button>
        </div>
      </section>
      <ReviewDialog
        isOpen={reviewing}
        onOpenChange={setReviewing}
        draft={draft}
        translates={locales.length > 1}
        onRevert={revert}
        onSend={api.sendDraft}
      />
    </>
  );
}
