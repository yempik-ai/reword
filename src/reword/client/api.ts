import type { CopyLiteral, Draft } from "../draft";
import type { Edit, SendResult } from "../schemas";

// The browser's side of the reword API (/api/reword, same origin).

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

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

/** The API of this site. `basePath` is the site's Next.js base path, if it has one. */
export function createApi(basePath: string) {
  return {
    fetchCopy: (locale: string) => call<{ literals: CopyLiteral[] }>(basePath, `literals?locale=${locale}`),
    saveEdit: (edit: Edit) => call<{ literal: CopyLiteral }>(basePath, "literals", edit),
    fetchDraft: () => call<Draft>(basePath, "draft"),
    sendDraft: () => call<SendResult>(basePath, "draft", {}),
  };
}
