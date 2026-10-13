import { describe, expect, it } from "vitest";
import { createToken, verifyToken } from "./tokens";

const secret = "test-secret";
const now = new Date("2026-10-10T12:00:00Z");
const issue = () =>
  createToken({ email: "ana@example.com" }, { secret, expiresInSeconds: 60, now });

describe("tokens", () => {
  it("round-trips the payload", () => {
    expect(verifyToken<{ email: string }>(issue(), { secret, now })?.email).toBe("ana@example.com");
  });

  it("rejects an expired token", () => {
    const later = new Date(now.getTime() + 61_000);
    expect(verifyToken(issue(), { secret, now: later })).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    expect(verifyToken(issue(), { secret: "other", now })).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const [, signature] = issue().split(".");
    const forged = Buffer.from(
      JSON.stringify({ email: "mallory@example.com", exp: 9_999_999_999 }),
    ).toString("base64url");
    expect(verifyToken(`${forged}.${signature}`, { secret, now })).toBeNull();
  });

  it("rejects malformed input", () => {
    for (const token of ["", "abc", "a.b.c", ".", "a."]) {
      expect(verifyToken(token, { secret, now })).toBeNull();
    }
  });
});
