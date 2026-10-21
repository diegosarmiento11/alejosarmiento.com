import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { linkSecret } from "./features";
import { createToken, verifyToken } from "./tokens";

// The author signs in to /escribir with a password and gets a signed cookie.
// There is one author, so there are no accounts: the cookie only says "admin".

export const ADMIN_COOKIE = "admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 30;

// Development opens with "dev" so the screen can be exercised without setup.
export const adminPassword =
  env.adminPassword ?? (env.isProduction ? undefined : "dev");

export const adminReady = Boolean(adminPassword && linkSecret);

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function passwordMatches(input: unknown, expected: string): boolean {
  if (typeof input !== "string" || input.length === 0) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

// Folding the password into the secret logs everyone out when it changes.
function sessionSecret(password: string, secret: string): string {
  return `${secret}:${digest(password).toString("hex")}`;
}

export function createAdminSession({
  password,
  secret,
  now,
}: {
  password: string;
  secret: string;
  now: Date;
}): string {
  return createToken(
    { role: "admin" },
    { secret: sessionSecret(password, secret), expiresInSeconds: ADMIN_SESSION_SECONDS, now },
  );
}

export function isAdminSession(
  token: string | undefined,
  { password, secret, now }: { password: string; secret: string; now: Date },
): boolean {
  if (!token) return false;
  const payload = verifyToken<{ role?: string }>(token, {
    secret: sessionSecret(password, secret),
    now,
  });
  return payload?.role === "admin";
}
