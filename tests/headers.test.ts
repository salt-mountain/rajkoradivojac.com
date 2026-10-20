import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const headersPath = join(DIST, "_headers");

// Static-asset headers served by Cloudflare Pages. The _headers file lives in
// public/ and is copied to dist/ at build; Pages does not apply it to the
// Functions under functions/, which set their own responses.
describe("_headers", () => {
  it("is emitted to the build output", () => {
    expect(existsSync(headersPath), headersPath).toBe(true);
  });

  const headers = existsSync(headersPath)
    ? readFileSync(headersPath, "utf8")
    : "";
  const csp = headers.match(/Content-Security-Policy:(.*)/)?.[1] ?? "";

  it("allows the YouTube thumbnails the homepage shows", () => {
    expect(csp).toContain("img-src");
    expect(csp).toContain("https://i.ytimg.com");
  });

  it("keeps forms and connections same-origin", () => {
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("default-src 'self'");
  });

  it("sets the baseline hardening headers", () => {
    for (const h of [
      "X-Content-Type-Options: nosniff",
      "Referrer-Policy: strict-origin-when-cross-origin",
      "Strict-Transport-Security:",
    ]) {
      expect(headers, h).toContain(h);
    }
  });
});
