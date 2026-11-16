// Word-level diff for the review sheet: what Simone took out and what he put
// in, inside one running text. Pure.

export type WordChange = { kind: "same" | "removed" | "added"; text: string };

/** Above this many word pairs the table is not worth it: show before and after whole. */
const MAX_CELLS = 4_000_000;

const words = (text: string) => text.match(/\S+\s*|\s+/g) ?? [];

/** Compares two versions of a text by longest common subsequence of words. */
export function diffWords(before: string, after: string): WordChange[] {
  const a = words(before);
  const b = words(after);
  if (a.length * b.length > MAX_CELLS) {
    return [
      { kind: "removed", text: before },
      { kind: "added", text: after },
    ];
  }

  // common[i][j]: length of the longest common subsequence of a[i..] and b[j..].
  const width = b.length + 1;
  const common = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      common[i * width + j] =
        a[i] === b[j]
          ? common[(i + 1) * width + j + 1] + 1
          : Math.max(common[(i + 1) * width + j], common[i * width + j + 1]);
    }
  }

  const changes: WordChange[] = [];
  const push = (kind: WordChange["kind"], text: string) => {
    const last = changes.at(-1);
    if (last?.kind === kind) last.text += text;
    else changes.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i += 1;
      j += 1;
    } else if (common[(i + 1) * width + j] >= common[i * width + j + 1]) {
      push("removed", a[i]);
      i += 1;
    } else {
      push("added", b[j]);
      j += 1;
    }
  }
  for (; i < a.length; i += 1) push("removed", a[i]);
  for (; j < b.length; j += 1) push("added", b[j]);
  return changes;
}
