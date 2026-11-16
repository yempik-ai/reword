import type { CopyLiteral, Draft } from "../draft";
import type { Edit, SendResult } from "../schemas";

// The editor's backend. Two implementations of one interface: the dev
// server's API (/api/reword, same origin, below) and the playground, which
// keeps the draft in the browser (playground.ts). Reword.tsx uses either the
// same way.

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type Api = {
  /** Where a save lands: the source file, or the browser's copy of it. */
  kind: "dev" | "playground";
  fetchCopy: (locale: string) => Promise<Result<{ literals: CopyLiteral[] }>>;
  saveEdit: (edit: Edit) => Promise<Result<{ literal: CopyLiteral }>>;
  fetchDraft: () => Promise<Result<Draft>>;
  sendDraft: () => Promise<Result<SendResult>>;
  /**
   * Makes the page show the draft. The dev server re-renders the page after a
   * save; a static build never will, so the playground writes the saved copy
   * into the page itself. Called before every scan.
   */
  present?: (root: Element, locale: string) => void;
};

async function call<T>(base: string, path: string, body?: unknown): Promise<Result<T>> {
  try {
    const response = await fetch(`${base}/api/reword/${path}`, {
      cache: "no-store",
      ...(body === undefined
        ? {}
        : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    });
    const data: unknown = await response.json();
    if (response.ok) return { ok: true, value: data as T };
    const error = typeof data === "object" && data !== null && "error" in data ? String(data.error) : response.statusText;
    return { ok: false, error };
  } catch {
    return { ok: false, error: "reword does not answer. Is `npm run edit` still running?" };
  }
}

/** The API of this site's dev server. `basePath` is the site's Next.js base path, if it has one. */
export function createApi(basePath: string): Api {
  return {
    kind: "dev",
    fetchCopy: (locale) => call(basePath, `literals?locale=${locale}`),
    saveEdit: (edit) => call(basePath, "literals", edit),
    fetchDraft: () => call(basePath, "draft"),
    sendDraft: () => call(basePath, "draft", {}),
  };
}
