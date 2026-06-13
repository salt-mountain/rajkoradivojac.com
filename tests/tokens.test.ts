import { describe, it, expect } from "vitest";
import {
  signActionToken,
  verifyActionToken,
  generateUnsubscribeToken,
  SEVEN_DAYS_SECONDS,
} from "../functions/_lib/tokens";

const SECRET = "test-secret-please-ignore-0123456789abcdef";
const future = () => Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS;

describe("action tokens", () => {
  it("round-trips a valid confirm token", async () => {
    const exp = future();
    const token = await signActionToken(
      { action: "confirm", sid: 42, book: "how-to-say-no", exp },
      SECRET,
    );
    expect(await verifyActionToken(token, SECRET)).toEqual({
      action: "confirm",
      sid: 42,
      book: "how-to-say-no",
      exp,
    });
  });

  it("supports a null book (general newsletter signup)", async () => {
    const token = await signActionToken(
      { action: "confirm", sid: 1, book: null, exp: future() },
      SECRET,
    );
    expect((await verifyActionToken(token, SECRET))?.book).toBeNull();
  });

  it("round-trips a resubscribe token", async () => {
    const token = await signActionToken(
      { action: "resubscribe", sid: 7, book: "queen-rearing", exp: future() },
      SECRET,
    );
    expect((await verifyActionToken(token, SECRET))?.action).toBe(
      "resubscribe",
    );
  });

  it("rejects a tampered token", async () => {
    const token = await signActionToken(
      { action: "confirm", sid: 1, book: null, exp: future() },
      SECRET,
    );
    const [body, sig] = token.split(".");
    expect(await verifyActionToken(`${body}x.${sig}`, SECRET)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signActionToken(
      { action: "confirm", sid: 1, book: null, exp: future() },
      SECRET,
    );
    expect(await verifyActionToken(token, "a-different-secret")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signActionToken(
      {
        action: "confirm",
        sid: 1,
        book: null,
        exp: Math.floor(Date.now() / 1000) - 10,
      },
      SECRET,
    );
    expect(await verifyActionToken(token, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyActionToken("garbage", SECRET)).toBeNull();
    expect(await verifyActionToken("a.b.c", SECRET)).toBeNull();
    expect(await verifyActionToken("", SECRET)).toBeNull();
  });
});

describe("unsubscribe tokens", () => {
  it("are unique and URL-safe", () => {
    const a = generateUnsubscribeToken();
    const b = generateUnsubscribeToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });
});
