import { INLINE_LINK } from "../inline-links";
import { CHROME, HIDDEN, type Target } from "./targets";

// ---------------------------------------------------------------------------
// The in-place edit. React owns every node of the page, so nothing of React's
// is removed or replaced: its text nodes are emptied, its child elements are
// hidden with an attribute, and one editable span of ours is added next to
// them. The span inherits the typography of its place, so the copy is edited
// where it is, as it looks. Closing puts everything back.
// ---------------------------------------------------------------------------

/** How long a saved paragraph waits for the dev server to re-render it. */
const REFRESH_TIMEOUT_MS = 4000;

/** On the element that holds the open text: draws the frame around it. */
const EDITING = "data-reword-editing";

export type Surface = {
  node: HTMLElement;
  /** The text as typed. */
  read(): string;
  /** Replaces the text being edited. */
  load(value: string): void;
  /** Stops or allows typing: the text does not move while its save is on the way. */
  lock(locked: boolean): void;
  /**
   * Ends the edit and gives the place back to the page. Pass the saved copy
   * so the page shows it at once, before the dev server re-renders.
   */
  close(saved?: string): void;
};

function placeCaret(node: HTMLElement, point: { x: number; y: number } | null): void {
  const selection = window.getSelection();
  if (!selection) return;
  if (point) {
    const position = document.caretPositionFromPoint?.(point.x, point.y);
    if (position && node.contains(position.offsetNode)) {
      selection.collapse(position.offsetNode, position.offset);
      return;
    }
  }
  selection.selectAllChildren(node);
  selection.collapseToEnd();
}

/** Opens the editable surface over a target, showing the source text of its copy. */
export function openSurface(target: Target, value: string, point: { x: number; y: number } | null): Surface {
  const node = document.createElement("span");
  node.setAttribute(CHROME, "surface");
  node.setAttribute("role", "textbox");
  node.setAttribute("aria-label", "Edit copy");
  node.contentEditable = "plaintext-only";
  node.spellcheck = true;
  node.textContent = value;

  const emptied: [Text, string][] = [];
  const hidden: Element[] = [];
  const empty = (text: Text) => {
    emptied.push([text, text.data]);
    text.data = "";
  };

  if (target.text) {
    empty(target.text);
    target.text.after(node);
  } else {
    for (const child of target.element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) empty(child as Text);
      // Hidden already: React's links, under copy the playground shows (see showCopy).
      else if (child instanceof Element && !child.hasAttribute(HIDDEN)) {
        child.setAttribute(HIDDEN, "");
        hidden.push(child);
      }
    }
    target.element.append(node);
  }

  target.element.setAttribute(EDITING, "");
  node.focus({ preventScroll: true });
  placeCaret(node, point);

  let restored = false;
  const restore = (saved?: string) => {
    if (restored) return;
    restored = true;
    node.remove();
    target.element.removeAttribute(EDITING);
    for (const element of hidden) element.removeAttribute(HIDDEN);
    for (const [text, original] of emptied) {
      // A node React has written to in the meantime already holds the new copy.
      if (text.data === "") text.data = text === target.text && saved !== undefined ? saved : original;
    }
  };

  return {
    node,
    read: () => node.textContent ?? "",
    load: (next) => {
      node.textContent = next;
      placeCaret(node, null);
    },
    lock: (locked) => {
      node.contentEditable = locked ? "false" : "plaintext-only";
    },
    close: (saved) => {
      if (saved === undefined || target.text) {
        restore(saved);
        return;
      }
      // Copy with links cannot be shown from here: keep the saved source text
      // in place until React renders the new paragraph, then step aside.
      node.contentEditable = "false";
      const observer = new MutationObserver(done);
      const timeout = window.setTimeout(done, REFRESH_TIMEOUT_MS);
      function done() {
        observer.disconnect();
        window.clearTimeout(timeout);
        restore();
      }
      observer.observe(target.element, { childList: true, characterData: true, subtree: true });
    },
  };
}

// ---------------------------------------------------------------------------
// Showing saved copy where React will not (the playground). On the dev
// server a save re-renders the page. A static build never re-renders, so the
// saved text is written into the page by the same rule as the edit: React's
// text nodes are emptied or rewritten, its elements hidden, and one span of
// ours carries copy that holds links. Every change is recorded, so the page
// can be given back exactly as React made it.
// ---------------------------------------------------------------------------

const SHOWN = "data-reword-shown";

type Overlay = { texts: [Text, string][]; hidden: Element[]; span: HTMLElement | null };

/** What was changed at each place, keyed by the place's text node or element. */
const overlays = new WeakMap<Node, Overlay>();

const placeOf = (target: Target): Node => target.text ?? target.element;

/** `/en/writing/x/` and `/en/writing/x` are one address, with or without the base path. */
function sameHref(rendered: string | null, written: string, basePath: string): boolean {
  if (rendered === null) return false;
  const strip = (href: string) =>
    (basePath && href.startsWith(`${basePath}/`) ? href.slice(basePath.length) : href).replace(/\/$/, "");
  return strip(rendered) === strip(written);
}

/** A link of the saved copy: a copy of the site's own anchor for that address, so it keeps the site's look. */
function anchor(label: string, href: string, models: HTMLAnchorElement[], basePath: string): HTMLAnchorElement {
  const index = models.findIndex((model) => sameHref(model.getAttribute("href"), href, basePath));
  if (index < 0) {
    const created = document.createElement("a");
    // A link the visitor typed. Only web addresses and site paths become
    // links: anything else (`javascript:` above all) stays plain text.
    if (/^(https?:\/\/|mailto:|\/|#)/i.test(href)) created.href = href.startsWith("/") ? `${basePath}${href}` : href;
    created.textContent = label;
    return created;
  }
  const [model] = models.splice(index, 1);
  const link = model.cloneNode(true) as HTMLAnchorElement;
  link.removeAttribute(HIDDEN);
  const text = [...link.childNodes].find((node): node is Text => node.nodeType === Node.TEXT_NODE);
  if (text) text.data = label;
  else link.prepend(label);
  return link;
}

/** Copy that holds `[label](href)` links, as the nodes a reader sees. */
function render(span: HTMLElement, value: string, models: HTMLAnchorElement[], basePath: string): void {
  const pool = [...models];
  const nodes: (string | Node)[] = [];
  let last = 0;
  for (const match of value.matchAll(INLINE_LINK)) {
    if (match.index > last) nodes.push(value.slice(last, match.index));
    nodes.push(anchor(match[1], match[2], pool, basePath));
    last = match.index + match[0].length;
  }
  if (last < value.length) nodes.push(value.slice(last));
  span.replaceChildren(...nodes);
}

/** Shows `value` at a place on the page, in place of the copy React rendered there. */
export function showCopy(target: Target, value: string, basePath: string): void {
  const place = placeOf(target);
  let overlay = overlays.get(place);
  if (!overlay) {
    overlay = { texts: [], hidden: [], span: null };
    overlays.set(place, overlay);
  }
  const record = (text: Text) => {
    if (!overlay.texts.some(([known]) => known === text)) overlay.texts.push([text, text.data]);
  };

  // Plain copy in a plain place: the text node simply says something else.
  if (target.text && !overlay.span && !value.match(INLINE_LINK)) {
    record(target.text);
    target.text.data = value;
    return;
  }

  if (!overlay.span) {
    const span = document.createElement("span");
    span.setAttribute(SHOWN, "");
    if (target.text) {
      record(target.text);
      target.text.data = "";
      target.text.after(span);
    } else {
      for (const child of target.element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          record(child as Text);
          (child as Text).data = "";
        } else if (child instanceof Element && !child.hasAttribute(HIDDEN)) {
          child.setAttribute(HIDDEN, "");
          overlay.hidden.push(child);
        }
      }
      target.element.append(span);
    }
    overlay.span = span;
  }
  const models = [...target.element.querySelectorAll<HTMLAnchorElement>(`a[${HIDDEN}]`)];
  render(overlay.span, value, models, basePath);
}

/** Gives a place back to React, exactly as it rendered it. */
export function restoreCopy(target: Target): void {
  const place = placeOf(target);
  const overlay = overlays.get(place);
  if (!overlay) return;
  overlays.delete(place);
  overlay.span?.remove();
  for (const element of overlay.hidden) element.removeAttribute(HIDDEN);
  for (const [text, data] of overlay.texts) text.data = data;
}
