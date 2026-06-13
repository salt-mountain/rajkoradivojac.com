import { describe, it, expect } from "vitest";
import { validateEmail, normalizeEmail } from "../functions/_lib/validation";

describe("validateEmail", () => {
  it("accepts normal addresses", () => {
    expect(validateEmail("a@b.com")).toBe(true);
    expect(validateEmail("first.last+tag@sub.example.co.uk")).toBe(true);
    expect(validateEmail("o'brien@example.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(validateEmail("no-at-sign")).toBe(false);
    expect(validateEmail("a@b")).toBe(false); // no TLD dot
    expect(validateEmail("a@@b.com")).toBe(false);
    expect(validateEmail("a b@c.com")).toBe(false); // space in local part
    expect(validateEmail(" a@b.com")).toBe(false); // leading space
    expect(validateEmail("")).toBe(false);
  });

  it("enforces the 254-char max", () => {
    expect(validateEmail("a".repeat(250) + "@b.com")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(validateEmail(undefined)).toBe(false);
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(123 as unknown)).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});
