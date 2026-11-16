import { z } from "zod";
import type { ForbiddenPattern } from "./config.ts";

// Request schemas for the reword API. One definition for the route handlers
// (parsing) and the browser (types, and the same checks while typing).

/** A piece of copy as the author may write it, with the site's house rules. */
export function copySchema(forbid: readonly ForbiddenPattern[]) {
  return forbid.reduce(
    (schema, rule) => schema.refine((text) => !new RegExp(rule.pattern, "u").test(text), rule.message),
    z
      .string()
      .max(20_000, "Too long for one piece of copy.")
      .refine((text) => text.trim().length > 0, "The text cannot be empty.")
      // Every control character except the line feed.
      .refine((text) => !/[\u0000-\u0009\u000b-\u001f\u007f]/.test(text), "Control characters are not allowed.")
      // Half of a surrogate pair would not survive being written to disk.
      .refine((text) => text.isWellFormed(), "The text holds a broken character.")
  );
}

export function editSchema(forbid: readonly ForbiddenPattern[]) {
  return z.object({
    file: z.string().min(1),
    path: z.string().min(1),
    /** The value the browser saw: the save is refused if the file moved on. */
    before: z.string(),
    after: copySchema(forbid),
  });
}

export type Edit = z.infer<ReturnType<typeof editSchema>>;

/** What a send did: an agent was started, or here is the prompt to paste. */
export type SendResult = { sent: true; via: string } | { sent: false; prompt: string };
