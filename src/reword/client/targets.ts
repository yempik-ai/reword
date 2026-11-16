import type { CopyLiteral } from "../draft";
import { visibleText } from "../inline-links";

// ---------------------------------------------------------------------------
// Finds the copy on the page. A site renders its content strings untouched,
// so a text node whose text equals a piece of copy IS that copy, and a
// paragraph with inline links equals the copy with each link reduced to its
// label. No markers, no wrapper components, nothing to add to the site.
// Read-only: the page is never changed to find or to mark a target (marking
// is the CSS Custom Highlight API, see Reword.tsx).
// ---------------------------------------------------------------------------

/** A place on the page that shows one piece of copy. */
export type Target = {
  /** The element that holds the copy. */
  element: Element;
  /** The text node that is the copy, or `null` when the copy fills `element` (copy with inline links). */
  text: Text | null;
  /** Every literal with this exact text, the one that belongs here first. */
  candidates: CopyLiteral[];
  range: Range;
};

export type Targets = {
  list: Target[];
  byText: Map<Text, Target>;
  byElement: Map<Element, Target>;
};

/** Marks the tool's own elements: never scanned, and always clickable. */
export const CHROME = "data-reword";

const SKIPPED = new Set(["script", "style", "noscript", "template", "textarea", "svg", "canvas"]);

/** Notes for screen readers inside a link ("opens in a new tab") are not part of the copy. */
const UNSEEN = ".sr-only, .visually-hidden, [hidden]";

/** How many neighbours on each side may settle which literal a repeated text is. */
const NEIGHBOURS = 12;

function group(literals: readonly CopyLiteral[], key: (literal: CopyLiteral) => string | null) {
  const groups = new Map<string, CopyLiteral[]>();
  for (const literal of literals) {
    const text = key(literal);
    if (text === null) continue;
    const found = groups.get(text);
    if (found) found.push(literal);
    else groups.set(text, [literal]);
  }
  return groups;
}

/** What a reader sees inside an element: its text without screen-reader-only notes. */
function readableText(element: Element): string {
  let text = "";
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) text += (child as Text).data;
    else if (child instanceof Element && !child.matches(UNSEEN)) text += readableText(child);
  }
  return text;
}

function depth(node: Node): number {
  let count = 0;
  for (let parent = node.parentNode; parent; parent = parent.parentNode) count += 1;
  return count;
}

/** Depth of the closest common ancestor: the higher, the closer two elements sit on the page. */
function kinship(a: Element, b: Element): number {
  const ancestors = new Set<Node>();
  for (let node: Node | null = a; node; node = node.parentNode) ancestors.add(node);
  for (let node: Node | null = b; node; node = node.parentNode) {
    if (ancestors.has(node)) return depth(node);
  }
  return -1;
}

const segments = (path: string) => path.match(/[^.[\]"]+/g) ?? [];

function sharedPrefix(a: string, b: string): number {
  const left = segments(a);
  const right = segments(b);
  let length = 0;
  while (length < left.length && length < right.length && left[length] === right[length]) length += 1;
  return length;
}

/**
 * A text used by several literals ("Read more" under every post) belongs to
 * the literal that lives next to the copy around it: same file, longest
 * shared address, then nearest in the source. The neighbour that decides is
 * the closest one on the page whose own literal is certain.
 */
function settle(list: Target[]): void {
  list.forEach((target, index) => {
    if (target.candidates.length < 2) return;
    const neighbours = list
      .slice(Math.max(0, index - NEIGHBOURS), index + NEIGHBOURS + 1)
      .filter((other) => other.candidates.length === 1)
      .map((other) => ({ literal: other.candidates[0], kin: kinship(target.element, other.element) }))
      .sort((a, b) => b.kin - a.kin);

    for (const { literal } of neighbours) {
      if (!target.candidates.some((candidate) => candidate.file === literal.file)) continue;
      const score = (candidate: CopyLiteral) =>
        candidate.file === literal.file
          ? [sharedPrefix(candidate.path, literal.path), -Math.abs(candidate.order - literal.order)]
          : [-1, 0];
      target.candidates = [...target.candidates].sort((a, b) => {
        const [prefixA, nearA] = score(a);
        const [prefixB, nearB] = score(b);
        return prefixB - prefixA || nearB - nearA;
      });
      return;
    }
  });
}

/** Scans the page for every place that shows a piece of copy. */
export function findTargets(root: Element, literals: readonly CopyLiteral[]): Targets {
  const plain = group(literals, (literal) => literal.value);
  const linked = group(literals, (literal) => {
    const visible = visibleText(literal.value);
    return visible === literal.value ? null : visible;
  });

  const targets: Targets = { list: [], byText: new Map(), byElement: new Map() };
  const linkParents = new Set<Element>();
  // Copy with links renders as an element that holds text and anchors.
  if (linked.size > 0) {
    for (const link of root.querySelectorAll("a")) {
      if (link.parentElement) linkParents.add(link.parentElement);
    }
  }

  const walk = (parent: Node): void => {
    for (const child of parent.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child as Text;
        const candidates = plain.get(text.data);
        if (!candidates || !text.parentElement) continue;
        const range = new Range();
        range.selectNodeContents(text);
        const target: Target = { element: text.parentElement, text, candidates, range };
        targets.list.push(target);
        targets.byText.set(text, target);
      } else if (child instanceof Element) {
        if (SKIPPED.has(child.localName) || child.hasAttribute(CHROME)) continue;
        const candidates = linkParents.has(child) ? linked.get(readableText(child)) : undefined;
        if (!candidates) {
          walk(child);
          continue;
        }
        const range = new Range();
        range.selectNodeContents(child);
        const target: Target = { element: child, text: null, candidates, range };
        targets.list.push(target);
        targets.byElement.set(child, target);
      }
    }
  };
  walk(root);
  settle(targets.list);
  return targets;
}

function covers(range: Range, x: number, y: number): boolean {
  for (const rect of range.getClientRects()) {
    if (x >= rect.left - 2 && x <= rect.right + 2 && y >= rect.top - 2 && y <= rect.bottom + 2) return true;
  }
  return false;
}

/** What the pointer is on: a piece of copy, text that is not copy, or nothing. */
export function hitTest(targets: Targets, element: Element, x: number, y: number): Target | "text" | null {
  let onText = false;
  for (const child of element.childNodes) {
    if (child.nodeType !== Node.TEXT_NODE || (child as Text).data.trim() === "") continue;
    const target = targets.byText.get(child as Text);
    if (target) {
      if (covers(target.range, x, y)) return target;
      continue;
    }
    const range = new Range();
    range.selectNodeContents(child);
    onText ||= covers(range, x, y);
  }
  for (let node: Element | null = element; node; node = node.parentElement) {
    const target = targets.byElement.get(node);
    if (target) return target;
  }
  return onText ? "text" : null;
}
