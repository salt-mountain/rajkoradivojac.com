import { describe, it, expect } from "vitest";
import { requireAdmin } from "../functions/_lib/admin-auth";
import type { Env } from "../functions/_lib/types";

const ADMIN = "admin@example.com";

// Production has Access vars; dev overrides them to undefined.
function env(overrides: Partial<Env> = {}): Env {
  return {
    ADMIN_EMAILS: ADMIN,
    ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
    ACCESS_AUD: "aud-tag",
    ...overrides,
  } as unknown as Env;
}

function req(headers: Record<string, string> = {}): Request {
  return new Request("https://rajkoradivojac.com/api/admin/stats", { headers });
}

const dev = { ACCESS_TEAM_DOMAIN: undefined, ACCESS_AUD: undefined };

describe("requireAdmin in production", () => {
  it("rejects a spoofed email header, even the admin's", async () => {
    const res = await requireAdmin(
      req({ "Cf-Access-Authenticated-User-Email": ADMIN }),
      env(),
    );
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(403);
  });

  it("rejects a request with no credentials", async () => {
    const res = await requireAdmin(req(), env());
    expect((res as Response).status).toBe(403);
  });

  it("rejects an unverifiable JWT", async () => {
    const res = await requireAdmin(
      req({ "Cf-Access-Jwt-Assertion": "not-a-real-token" }),
      env(),
    );
    expect((res as Response).status).toBe(403);
  });
});

describe("requireAdmin in dev", () => {
  it("accepts an allowlisted email header", async () => {
    const res = await requireAdmin(
      req({ "Cf-Access-Authenticated-User-Email": ADMIN }),
      env(dev),
    );
    expect(res).not.toBeInstanceOf(Response);
    expect((res as { email: string }).email).toBe(ADMIN);
  });

  it("rejects an email that is not allowlisted", async () => {
    const res = await requireAdmin(
      req({ "Cf-Access-Authenticated-User-Email": "other@example.com" }),
      env(dev),
    );
    expect((res as Response).status).toBe(403);
  });
});
