import { describe, expect, it } from "vitest";
import { shortAddress } from "./format";

describe("shortAddress", () => {
  it("keeps the 0x prefix and the last 4 chars joined by an ellipsis", () => {
    expect(shortAddress("0x1234567890abcdef")).toBe("0x1234…cdef");
  });

  it("returns short inputs unchanged", () => {
    expect(shortAddress("0x12")).toBe("0x12");
  });
});
