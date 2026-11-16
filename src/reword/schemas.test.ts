import { describe, expect, it } from "vitest";
import { copySchema } from "./schemas.ts";

describe("copySchema", () => {
  const schema = copySchema([{ pattern: "\\u2014", message: "No em dashes." }]);
  const error = (text: string) => schema.safeParse(text).error?.issues[0].message;

  it("accepts prose in any script, with line breaks", () => {
    expect(schema.safeParse("Zażółć gęślą jaźń. «Ciao»\nsecond line").success).toBe(true);
  });

  it("refuses empty text, control characters and broken characters", () => {
    expect(error("   ")).toBe("The text cannot be empty.");
    expect(error("tab\there")).toBe("Control characters are not allowed.");
    expect(error("half \ud83d pair")).toBe("The text holds a broken character.");
  });

  it("refuses what the house rules forbid, with the house's message", () => {
    expect(error("one \u2014 two")).toBe("No em dashes.");
  });
});
