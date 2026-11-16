import { describe, expect, it } from "vitest";
import type { Draft, DraftChange } from "../reword/draft";
import { issueLink, MAX_ISSUE_URL } from "./issue";

const change = (n: number, after: string): DraftChange => ({
  locale: "en",
  file: "src/content/home.ts",
  path: `home.en.faq.items[${n}].a`,
  line: 200 + n,
  before: "Before.",
  after,
  counterparts: [],
});

const decoded = (url: string) => decodeURIComponent(new URL(url).searchParams.get("body") ?? "");

describe("issueLink", () => {
  it("carries every edit of a short draft, as reword renders it", () => {
    const { url, included } = issueLink({ changes: [change(0, "After.")], other: [] });
    expect(included).toBe(1);
    expect(url.startsWith("https://github.com/yempik-ai/reword/issues/new?title=")).toBe(true);
    expect(decoded(url)).toContain("## 1. en · src/content/home.ts:200 · `home.en.faq.items[0].a`");
    expect(decoded(url)).toContain("> After.");
  });

  it("stays short enough for GitHub, and says what it left out", () => {
    const draft: Draft = { changes: Array.from({ length: 12 }, (_, n) => change(n, "word ".repeat(150))), other: [] };
    const { url, included } = issueLink(draft);
    expect(url.length).toBeLessThanOrEqual(MAX_ISSUE_URL);
    expect(included).toBeGreaterThan(0);
    expect(included).toBeLessThan(12);
    expect(decoded(url)).toContain(`${12 - included} more edits did not fit in the link.`);
  });
});
