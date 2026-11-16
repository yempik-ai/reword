import { sendToAgent } from "./agents.ts";
import type { RewordConfig } from "./config.ts";
import { listCopy } from "./draft.ts";
import { rejectRequest } from "./guard.ts";
import { editSchema } from "./schemas.ts";
import { readDraft, readWorkspace, RewordError, saveLiteral } from "./workspace.ts";

// ---------------------------------------------------------------------------
// reword's API, for one catch-all route file:
//
//   // src/app/api/reword/[action]/route.reword.ts
//   export const { GET, POST } = rewordRoutes(config);
//
//   GET  /api/reword/literals?locale=en   the copy of one locale
//   POST /api/reword/literals             save one edit
//   GET  /api/reword/draft                the pending draft
//   POST /api/reword/draft                hand the draft to the agent
// ---------------------------------------------------------------------------

const STATUS = { not_found: 404, not_editable: 403, conflict: 409, invalid: 422, empty: 409, no_git: 409 } as const;

type Context = { params: Promise<{ action: string }> };

const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

function refusal(error: unknown): Response {
  if (!(error instanceof RewordError)) throw error;
  return Response.json({ error: error.message }, { status: STATUS[error.code] });
}

export function rewordRoutes(config: RewordConfig) {
  const root = process.cwd();
  const edit = editSchema(config.forbid);

  async function GET(request: Request, { params }: Context) {
    const rejected = rejectRequest(request);
    if (rejected) return rejected;
    const { action } = await params;
    try {
      if (action === "draft") return Response.json(await readDraft(root, config));
      if (action !== "literals") return notFound();

      const locale = new URL(request.url).searchParams.get("locale");
      if (locale === null || !config.locales.includes(locale)) {
        return Response.json({ error: "Unknown locale." }, { status: 400 });
      }
      const { work, head } = await readWorkspace(root, config);
      return Response.json({ literals: listCopy(config, work, head, locale) });
    } catch (error) {
      return refusal(error);
    }
  }

  async function POST(request: Request, { params }: Context) {
    const rejected = rejectRequest(request);
    if (rejected) return rejected;
    const { action } = await params;
    try {
      if (action === "draft") {
        const draft = await readDraft(root, config);
        if (draft.changes.length === 0 && draft.other.length === 0) {
          throw new RewordError("empty", "The draft is empty: nothing to send.");
        }
        return Response.json(await sendToAgent(root, config.agent));
      }
      if (action !== "literals") return notFound();

      const parsed = edit.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid edit." }, { status: 422 });
      }
      return Response.json({ literal: await saveLiteral(root, config, parsed.data) });
    } catch (error) {
      return refusal(error);
    }
  }

  return { GET, POST };
}
