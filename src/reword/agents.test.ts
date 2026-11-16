import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PUBLISH_PROMPT, sendToAgent } from "./agents.ts";

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "reword-agent-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/** The detached process writes its log after we return: wait for it. */
async function log(): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const text = readFileSync(path.join(root, ".reword", "agent.log"), "utf8");
    if (text.length > 0) return text;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return "";
}

describe("sendToAgent", () => {
  it("returns the prompt to paste when told to start nothing", async () => {
    expect(await sendToAgent(root, "clipboard")).toEqual({ sent: false, prompt: PUBLISH_PROMPT });
  });

  it("starts any CLI with the prompt and the project folder filled in", async () => {
    const agent = { command: process.execPath, args: ["-e", "console.log(process.argv[1], '|', process.argv[2])", "{prompt}", "{root}"] };
    expect(await sendToAgent(root, agent)).toEqual({ sent: true, via: process.execPath });
    expect(await log()).toBe(`${PUBLISH_PROMPT} | ${root}\n`);
  });

  it("falls back to the prompt when the CLI is not installed", async () => {
    const agent = { command: "reword-no-such-agent", args: ["{prompt}"] };
    expect(await sendToAgent(root, agent)).toEqual({ sent: false, prompt: PUBLISH_PROMPT });
  });
});
