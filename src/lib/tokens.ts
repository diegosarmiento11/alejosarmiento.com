import { createHmac, timingSafeEqual } from "node:crypto";

// Signed, expiring tokens for links sent by email (newsletter confirmation and
// comment moderation). The payload travels in the token, so nothing is stored
// until the link is used.

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createToken<T extends object>(
  payload: T,
  { secret, expiresInSeconds, now }: { secret: string; expiresInSeconds: number; now: Date },
): string {
  const exp = Math.floor(now.getTime() / 1000) + expiresInSeconds;
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  return `${data}.${sign(data, secret)}`;
}

export function verifyToken<T extends object>(
  token: string,
  { secret, now }: { secret: string; now: Date },
): T | null {
  const [data, signature, ...rest] = token.split(".");
  if (!data || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(data, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as T & {
      exp: number;
    };
    if (typeof payload.exp !== "number" || payload.exp < now.getTime() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
