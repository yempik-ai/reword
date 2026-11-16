import { site } from "../content/site";
import { renderEdits, type Draft } from "../reword/draft";

// "Send your edit to us": a prefilled GitHub issue that carries the visitor's
// edits as reword renders them. GitHub refuses very long addresses, so the
// link holds as many whole edits as fit, and says how many it left out.

/** Comfortably under the length GitHub accepts for a new-issue link. */
export const MAX_ISSUE_URL = 7000;

export type IssueLink = { url: string; included: number };

function link(draft: Draft, count: number): string {
  const total = draft.changes.length;
  const body = [
    site.issue.intro,
    ...(count > 0 ? [renderEdits({ changes: draft.changes.slice(0, count), other: [] })] : []),
    ...(count < total ? [`${total - count} more ${total - count === 1 ? "edit" : "edits"} did not fit in the link.`] : []),
    site.issue.outro,
  ].join("\n\n");
  const title = `${site.issue.title}: ${total} ${total === 1 ? "edit" : "edits"}`;
  return `${site.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

/** The new-issue link for a draft, with every edit that fits. */
export function issueLink(draft: Draft): IssueLink {
  for (let count = draft.changes.length; count > 0; count -= 1) {
    const url = link(draft, count);
    if (url.length <= MAX_ISSUE_URL) return { url, included: count };
  }
  return { url: link(draft, 0), included: 0 };
}
