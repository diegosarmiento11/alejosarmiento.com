import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_SECONDS,
  createAdminSession,
  isAdminSession,
  passwordMatches,
} from "./admin-session";

const now = new Date("2026-10-21T12:00:00Z");
const options = { password: "correcta", secret: "secreto", now };

describe("passwordMatches", () => {
  it("accepts only the exact password", () => {
    expect(passwordMatches("correcta", "correcta")).toBe(true);
    expect(passwordMatches("Correcta", "correcta")).toBe(false);
    expect(passwordMatches("", "correcta")).toBe(false);
    expect(passwordMatches(undefined, "correcta")).toBe(false);
  });
});

describe("admin session", () => {
  it("accepts a session it created", () => {
    expect(isAdminSession(createAdminSession(options), options)).toBe(true);
  });

  it("rejects a missing or tampered cookie", () => {
    expect(isAdminSession(undefined, options)).toBe(false);
    expect(isAdminSession(`${createAdminSession(options)}x`, options)).toBe(false);
  });

  it("ends every session when the password changes", () => {
    const token = createAdminSession(options);
    expect(isAdminSession(token, { ...options, password: "nueva" })).toBe(false);
  });

  it("expires", () => {
    const token = createAdminSession(options);
    const later = new Date(now.getTime() + (ADMIN_SESSION_SECONDS + 1) * 1000);
    expect(isAdminSession(token, { ...options, now: later })).toBe(false);
  });
});
