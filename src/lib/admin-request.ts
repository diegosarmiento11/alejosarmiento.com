import type { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  adminPassword,
  createAdminSession,
  isAdminSession,
} from "./admin-session";
import { env } from "./env";
import { linkSecret } from "./features";

export function isAdmin(request: NextRequest): boolean {
  if (!adminPassword || !linkSecret) return false;
  return isAdminSession(request.cookies.get(ADMIN_COOKIE)?.value, {
    password: adminPassword,
    secret: linkSecret,
    now: new Date(),
  });
}

export function setAdminCookie(response: NextResponse): void {
  if (!adminPassword || !linkSecret) return;
  response.cookies.set(
    ADMIN_COOKIE,
    createAdminSession({ password: adminPassword, secret: linkSecret, now: new Date() }),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: env.isProduction,
      maxAge: ADMIN_SESSION_SECONDS,
      path: "/",
    },
  );
}

export function clearAdminCookie(response: NextResponse): void {
  response.cookies.delete(ADMIN_COOKIE);
}
