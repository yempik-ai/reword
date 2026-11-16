import type { CopyLiteral, Draft } from "../draft";

// ---------------------------------------------------------------------------
// What reword tells the page, and what the page may ask of it: DOM events on
// `window`, so a site can build around the editor (a live preview of the
// source, a guided tour, its own ending for the playground) without reaching
// into it. Typed through WindowEventMap.
//
//   reword:session      the text being edited, as typed, with the refusal
//                       if a house rule or a check says no. null when closed
//   reword:draft        the draft, each time it is read
//   reword:review       the review sheet opened
//   reword:send         playground only, cancelable: what the agent would
//                       read. Call preventDefault() to show your own ending
//
//   reword:open-text    ask reword to open the first text inside `element`
//                       (a keyboard path to editing)
//   reword:open-review  ask reword to open the review sheet
// ---------------------------------------------------------------------------

export type SessionDetail = { literal: CopyLiteral; text: string; error: string | null } | null;
export type SendDetail = { draft: Draft; brief: string; prompt: string };

type Told = {
  "reword:session": SessionDetail;
  "reword:draft": Draft;
  "reword:review": null;
  "reword:send": SendDetail;
};

type Asked = {
  "reword:open-text": { element: Element };
  "reword:open-review": null;
};

declare global {
  interface WindowEventMap {
    "reword:session": CustomEvent<Told["reword:session"]>;
    "reword:draft": CustomEvent<Told["reword:draft"]>;
    "reword:review": CustomEvent<Told["reword:review"]>;
    "reword:send": CustomEvent<Told["reword:send"]>;
    "reword:open-text": CustomEvent<Asked["reword:open-text"]>;
    "reword:open-review": CustomEvent<Asked["reword:open-review"]>;
  }
}

/** The last value of each event, for a listener that arrives late (a page mounted after a client navigation). */
const last = new Map<keyof Told, Told[keyof Told]>();

/** Tells the page. Returns false when a listener cancelled a cancelable event. */
export function tell<K extends keyof Told>(name: K, detail: Told[K], cancelable = false): boolean {
  last.set(name, detail);
  return window.dispatchEvent(new CustomEvent(name, { detail, cancelable }));
}

/** The last value reword told, if any. */
export function latest<K extends keyof Told>(name: K): Told[K] | undefined {
  return last.get(name) as Told[K] | undefined;
}

/** Asks reword to do something. Nothing happens when reword is not on the page. */
export function ask<K extends keyof Asked>(name: K, detail: Asked[K]): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
