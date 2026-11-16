import { execFile, spawn } from "node:child_process";
import { mkdir, open } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import type { RewordConfig } from "./config.ts";
import type { SendResult } from "./schemas.ts";

// ---------------------------------------------------------------------------
// The handoff: starting the agent that publishes the draft. Any agent works,
// because the agent needs one sentence only. T3 Code is built in, any other
// CLI is a line of config, and the prompt to paste is always the fallback.
// ---------------------------------------------------------------------------

const run = promisify(execFile);

/**
 * What every agent is asked to do. A constant: nothing typed in the browser
 * reaches a command line. `npm run draft` prints the edits and the procedure.
 */
export const PUBLISH_PROMPT =
  "Publish the reword draft: the uncommitted copy edits in this repository. Run `npm run draft` and follow the procedure it prints, from start to finish.";

/** What `t3 thread start --json` prints when the thread exists. */
const startedThread = z.object({ threadId: z.string().min(1) });

/** Starts a T3 Code thread in this project. The CLI exits 0 even when it refuses, so only its JSON counts. */
async function startT3(root: string, selection?: { provider: string; model: string }): Promise<boolean> {
  const model = selection ? ["--provider", selection.provider, "--model", selection.model] : [];
  const output = await run(
    "t3",
    ["thread", "start", root, PUBLISH_PROMPT, "--title", "Publish the reword draft", ...model, "--json"],
    { cwd: root, timeout: 30_000 }
  ).then(
    ({ stdout }) => stdout,
    () => null
  );
  if (output === null) return false;
  try {
    startedThread.parse(JSON.parse(output));
    return true;
  } catch {
    return false;
  }
}

/** Starts any agent CLI, detached, with its output in `.reword/agent.log`. */
async function startCommand(root: string, command: string, args: readonly string[]): Promise<boolean> {
  await mkdir(path.join(root, ".reword"), { recursive: true });
  const log = await open(path.join(root, ".reword", "agent.log"), "a");
  try {
    return await new Promise<boolean>((resolve) => {
      const child = spawn(
        command,
        args.map((arg) => arg.replaceAll("{prompt}", PUBLISH_PROMPT).replaceAll("{root}", root)),
        { cwd: root, detached: true, stdio: ["ignore", log.fd, log.fd] }
      );
      child.once("error", () => resolve(false));
      child.once("spawn", () => {
        child.unref();
        resolve(true);
      });
    });
  } finally {
    await log.close();
  }
}

/** Hands the draft to the configured agent, or returns the prompt for the author to paste. */
export async function sendToAgent(root: string, agent: RewordConfig["agent"]): Promise<SendResult> {
  const manual: SendResult = { sent: false, prompt: PUBLISH_PROMPT };
  if (agent === "clipboard") return manual;
  if (agent === "auto" || agent === "t3") {
    return (await startT3(root)) ? { sent: true, via: "T3 Code" } : manual;
  }
  if ("t3" in agent) return (await startT3(root, agent.t3)) ? { sent: true, via: "T3 Code" } : manual;
  return (await startCommand(root, agent.command, agent.args)) ? { sent: true, via: agent.command } : manual;
}
