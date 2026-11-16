// Who may call the reword API. The routes write files in the repository and
// can start an agent, so they answer only to the page served by this same dev
// server, on this machine:
// - they exist only under `npm run edit` (see next.ts: without the flag the
//   route file is not a route at all), and that script binds the server to
//   127.0.0.1;
// - the Host header must be loopback, which stops DNS rebinding;
// - a browser request must be same-origin, which stops other sites open in
//   the browser from reading the draft or writing through a form or fetch.

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

function refuse(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** Returns the refusal for a request that must not be served, or `null` to go on. */
export function rejectRequest(request: Request): Response | null {
  if (process.env.NODE_ENV !== "development" || process.env.REWORD !== "1") {
    return refuse(404, "Not found");
  }
  const host = request.headers.get("host") ?? "";
  if (!LOOPBACK.has(host.replace(/:\d+$/, ""))) return refuse(403, "The reword API answers on loopback only.");

  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return refuse(403, "Cross-site request refused.");

  if (request.method !== "GET") {
    // The whole origin must match: scheme, host and port. A client that sends
    // no Sec-Fetch-Site (an old browser, a script) is held to this check alone.
    const origin = request.headers.get("origin");
    const own = new URL(request.url);
    if (origin === null || !URL.canParse(origin)) return refuse(403, "Cross-origin request refused.");
    const from = new URL(origin);
    if (from.host !== host || from.protocol !== own.protocol) return refuse(403, "Cross-origin request refused.");
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return refuse(415, "Send JSON.");
    }
  }
  return null;
}
