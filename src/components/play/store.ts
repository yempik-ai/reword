"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { basePath } from "@/content/site";
import type { MarkId } from "@/content/play";
import { latest } from "@/reword/client/events";
import type { Draft } from "@/reword/draft";

// The play's state. What reword itself knows (the draft, the open text) is
// read from its events, never copied. The two marks it cannot know later (a
// house rule refused a text, the draft was sent) are kept per visitor, in
// localStorage, next to the draft they belong to.

const KEY = `reword-play:${basePath || "/"}`;
const CHANGED = "reword-play:change";

const flagsSchema = z.object({ rule: z.literal(true).optional(), send: z.literal(true).optional() });
type Flags = z.infer<typeof flagsSchema>;

function parse(raw: string | null): Flags {
  try {
    const parsed = flagsSchema.safeParse(JSON.parse(raw ?? "{}"));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

const NO_FLAGS: Flags = {};

let cache: { raw: string | null; flags: Flags } = { raw: null, flags: NO_FLAGS };

function readFlags(): Flags {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache.flags;
  }
  if (raw !== cache.raw) cache = { raw, flags: parse(raw) };
  return cache.flags;
}

/** Records a mark the editor cannot recompute (a refusal, a send). */
export function flag(name: keyof Flags): void {
  if (readFlags()[name]) return;
  const flags = { ...readFlags(), [name]: true };
  cache = { raw: JSON.stringify(flags), flags };
  try {
    localStorage.setItem(KEY, cache.raw ?? "{}");
  } catch {
    // Storage is off: the flag lasts as long as the page.
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(name: string) {
  return (onChange: () => void) => {
    window.addEventListener(name, onChange);
    return () => window.removeEventListener(name, onChange);
  };
}

const subscribeFlags = subscribe(CHANGED);

export function useFlags(): Flags {
  return useSyncExternalStore(subscribeFlags, readFlags, () => NO_FLAGS);
}

const subscribeDraft = subscribe("reword:draft");
const subscribeSession = subscribe("reword:session");

/** The draft as reword last read it. */
export function useDraft(): Draft | undefined {
  return useSyncExternalStore(subscribeDraft, () => latest("reword:draft"), () => undefined);
}

/** The text open in the editor, as typed. */
export function useSession() {
  return useSyncExternalStore(subscribeSession, () => latest("reword:session") ?? null, () => null);
}

const HEADLINE = /\.hero\.(before|struck|inserted|after)$/;

/** Which marks of the ticket are done. The first two are read off the draft itself. */
export function useMarks(typos: readonly string[]): Record<MarkId, boolean> {
  const draft = useDraft();
  const flags = useFlags();
  const changes = draft?.changes ?? [];
  return {
    headline: changes.some((change) => HEADLINE.test(change.path)),
    typo: changes.some(
      (change) => change.path.endsWith(".hero.note") && typos.some((typo) => change.before.includes(typo) && !change.after.includes(typo))
    ),
    rule: flags.rule === true,
    send: flags.send === true,
  };
}
