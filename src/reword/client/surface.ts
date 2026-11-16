import { CHROME, type Target } from "./targets";

// ---------------------------------------------------------------------------
// The in-place edit. React owns every node of the page, so nothing of React's
// is removed or replaced: its text nodes are emptied, its child elements are
// hidden with an attribute, and one editable span of ours is added next to
// them. The span inherits the typography of its place, so the copy is edited
// where it is, as it looks. Closing puts everything back.
// ---------------------------------------------------------------------------

/** How long a saved paragraph waits for the dev server to re-render it. */
const REFRESH_TIMEOUT_MS = 4000;

const HIDDEN = "data-reword-hidden";
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
      else if (child instanceof Element) {
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
