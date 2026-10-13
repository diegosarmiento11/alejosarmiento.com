import { type NextRequest, NextResponse } from "next/server";
import { addSubscriber } from "@/lib/email";
import { env } from "@/lib/env";
import { linkSecret, newsletterReady } from "@/lib/features";
import { readJson } from "@/lib/request";
import { verifyToken } from "@/lib/tokens";


export async function POST(request: NextRequest) {
  const { token } = await readJson(request);
  const secret = linkSecret;
  const payload =
    secret && typeof token === "string"
      ? verifyToken<{ email: string }>(token, { secret, now: new Date() })
      : null;
  if (!payload) {
    return NextResponse.json(
      { error: "El enlace no es válido o ya venció. Suscríbete de nuevo." },
      { status: 401 },
    );
  }
  if (!newsletterReady) {
    if (env.isProduction) {
      return NextResponse.json(
        { error: "La suscripción no está disponible en este momento." },
        { status: 503 },
      );
    }
    return NextResponse.json({ status: "confirmed" });
  }
  const added = await addSubscriber(payload.email);
  if (!added) {
    return NextResponse.json(
      { error: "No pudimos confirmar tu suscripción. Intenta de nuevo." },
      { status: 502 },
    );
  }
  return NextResponse.json({ status: "confirmed" });
}
