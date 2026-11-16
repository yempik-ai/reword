import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rejectRequest } from "./guard.ts";

const ORIGIN = "http://127.0.0.1:3000";

function request(method: "GET" | "POST", headers: Record<string, string>) {
  return new Request(`${ORIGIN}/api/reword/literals`, { method, headers });
}

const post = (headers: Record<string, string>) =>
  rejectRequest(request("POST", { host: "127.0.0.1:3000", "content-type": "application/json", ...headers }));

describe("rejectRequest", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REWORD", "1");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("serves the page of this dev server", () => {
    expect(rejectRequest(request("GET", { host: "localhost:3000", "sec-fetch-site": "same-origin" }))).toBeNull();
    expect(post({ origin: ORIGIN, "sec-fetch-site": "same-origin" })).toBeNull();
  });

  it("does not exist outside `npm run edit`", () => {
    vi.stubEnv("REWORD", "");
    expect(post({ origin: ORIGIN })?.status).toBe(404);
    vi.stubEnv("REWORD", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(post({ origin: ORIGIN })?.status).toBe(404);
  });

  it("refuses a host that is not loopback (DNS rebinding)", () => {
    expect(rejectRequest(request("GET", { host: "evil.test:3000" }))?.status).toBe(403);
  });

  it("refuses other sites, for reads and for writes", () => {
    expect(rejectRequest(request("GET", { host: "127.0.0.1:3000", "sec-fetch-site": "cross-site" }))?.status).toBe(403);
    expect(post({ origin: "http://evil.test" })?.status).toBe(403);
    expect(post({})?.status).toBe(403);
  });

  it("refuses the same host under another scheme: a different origin", () => {
    expect(post({ origin: "https://127.0.0.1:3000" })?.status).toBe(403);
  });

  it("refuses a write that a plain form could send", () => {
    expect(post({ origin: ORIGIN, "content-type": "text/plain" })?.status).toBe(415);
  });
});
