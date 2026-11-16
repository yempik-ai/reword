// ---------------------------------------------------------------------------
// reword's configuration. The site owner writes `reword.config.ts` at the
// project root with `defineConfig`; the route, the mount and the draft script
// pass it on. Pure: safe to import anywhere.
// ---------------------------------------------------------------------------

/**
 * Who receives the draft when the owner presses "Send to agent".
 * - `"auto"`: T3 Code when its CLI is on the PATH, otherwise the prompt to paste.
 * - `"t3"`: always T3 Code (`t3 thread start`), with the project's default model.
 * - `{ t3: { provider, model } }`: T3 Code with the model you name, for a
 *   project that has no default one.
 * - `"clipboard"`: never start anything, show the prompt to paste.
 * - a command: any agent CLI. `{prompt}` and `{root}` in `args` are replaced.
 *   The process is started detached and logs to `.reword/agent.log`.
 */
export type AgentConfig =
  | "auto"
  | "t3"
  | "clipboard"
  | { t3: { provider: string; model: string } }
  | { command: string; args: readonly string[] };

/** A house rule checked while typing and again on save. */
export type ForbiddenPattern = {
  /** Source of a regular expression, for example `"\\u2014"`. */
  pattern: string;
  /** Shown next to the text when the pattern matches. */
  message: string;
};

export type RewordConfig = {
  /** Languages of the site. One entry means a single-language site. */
  locales: readonly [string, ...string[]];
  /** Folders (relative to the project root) whose files hold the copy. */
  content: readonly string[];
  agent: AgentConfig;
  /** The command the agent runs before it commits. */
  check: string;
  forbid: readonly ForbiddenPattern[];
  /**
   * Single-language sites only: property names whose values are never copy.
   * Multi-language sites do not need it (see `isCopy` in draft.ts).
   */
  structuralKeys: readonly string[];
};

export const STRUCTURAL_KEYS = [
  "id", "slug", "key", "href", "url", "src", "path", "icon", "image",
  "date", "datetime", "type", "kind", "variant", "t", "lang", "locale", "email",
] as const;

/** Fills the defaults. `locales` is the only required field. */
export function defineConfig(config: Partial<RewordConfig> & Pick<RewordConfig, "locales">): RewordConfig {
  return {
    content: ["src/content"],
    agent: "auto",
    check: "npm run build",
    forbid: [],
    structuralKeys: STRUCTURAL_KEYS,
    ...config,
  };
}
