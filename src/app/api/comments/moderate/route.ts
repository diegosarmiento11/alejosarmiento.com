import { type NextRequest, NextResponse } from "next/server";
import { moderateComment } from "@/lib/engagement";
import { env } from "@/lib/env";
import { readJson } from "@/lib/request";
import { getStore } from "@/lib/store";
import { verifyToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  const { token, action } = await readJson(request);
  if (action !== "approve" && action !== "delete") {
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  }
  const payload =
    env.signingSecret && typeof token === "string"
      ? verifyToken<{ slug: string; id: string }>(token, {
          secret: env.signingSecret,
          now: new Date(),
        })
      : null;
  if (!payload) {
    return NextResponse.json({ error: "El enlace no es válido o ya venció." }, { status: 401 });
  }
  const result = await moderateComment(getStore(), payload.slug, payload.id, action);
  if (result === "not-found") {
    return NextResponse.json({ error: "Ese comentario ya no existe." }, { status: 404 });
  }
  return NextResponse.json({ result });
}
