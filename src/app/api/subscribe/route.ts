import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmationEmail, sendEmail } from "@/lib/email";
import { allowRequest } from "@/lib/engagement";
import { env } from "@/lib/env";
import { linkSecret, newsletterReady } from "@/lib/features";
import { clientIp, readJson } from "@/lib/request";
import { absoluteUrl } from "@/lib/site";
import { getStore } from "@/lib/store";
import { createToken } from "@/lib/tokens";

const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  // Honeypot: answer as if it worked.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ status: "sent" });
  }
  const email = z.email().max(254).safeParse(
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "",
  );
  if (!email.success) {
    return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  }
  if (!newsletterReady && env.isProduction) {
    return NextResponse.json(
      { error: "La suscripción no está disponible en este momento." },
      { status: 503 },
    );
  }

  const now = new Date();
  const allowed = await allowRequest(getStore(), "subscribe", clientIp(request), {
    limit: 5,
    windowSeconds: 3600,
    now,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Prueba de nuevo más tarde." },
      { status: 429 },
    );
  }

  const token = createToken(
    { email: email.data },
    { secret: linkSecret!, expiresInSeconds: SEVEN_DAYS, now },
  );
  const confirmUrl = absoluteUrl(`/newsletter/confirmar?token=${encodeURIComponent(token)}`);

  if (!newsletterReady) {
    const local = confirmUrl.replace(absoluteUrl("/"), `${request.nextUrl.origin}/`);
    console.info(`[newsletter] sin Brevo configurado; enlace de confirmación: ${local}`);
    return NextResponse.json({ status: "sent" });
  }

  const sent = await sendEmail({ to: email.data, ...confirmationEmail(confirmUrl) });
  if (!sent) {
    return NextResponse.json(
      { error: "No pudimos enviarte el correo. Intenta de nuevo." },
      { status: 502 },
    );
  }
  return NextResponse.json({ status: "sent" });
}
