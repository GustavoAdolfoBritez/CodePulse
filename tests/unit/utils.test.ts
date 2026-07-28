import { describe, expect, it } from "vitest";
import { cn, formatNumber } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", false, undefined, "b", null, "c")).toBe("a b c");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});

describe("formatNumber", () => {
  it("compacts large numbers", () => {
    expect(formatNumber(1500)).toBe("1.5K");
  });
});
