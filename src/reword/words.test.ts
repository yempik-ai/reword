import { describe, expect, it } from "vitest";
import { diffWords } from "./words.ts";

describe("diffWords", () => {
  it("keeps what stayed and marks what moved", () => {
    expect(diffWords("Il modello è una commodity.", "Il modello resta una commodity. Tu no.")).toEqual([
      { kind: "same", text: "Il modello " },
      { kind: "removed", text: "è " },
      { kind: "added", text: "resta " },
      { kind: "same", text: "una " },
      { kind: "removed", text: "commodity." },
      { kind: "added", text: "commodity. Tu no." },
    ]);
  });

  it("rebuilds both versions from its parts", () => {
    const before = "Ogni settimana qualcosa va in prod.";
    const after = "Ogni settimana, qualcosa di vero va in produzione.";
    const parts = diffWords(before, after);
    expect(parts.filter((part) => part.kind !== "added").map((part) => part.text).join("")).toBe(before);
    expect(parts.filter((part) => part.kind !== "removed").map((part) => part.text).join("")).toBe(after);
  });
});
