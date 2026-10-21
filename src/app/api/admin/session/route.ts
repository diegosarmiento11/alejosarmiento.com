import { type NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin-request";
import { adminPassword, adminReady, passwordMatches } from "@/lib/admin-session";
import { allowRequest } from "@/lib/engagement";
import { clientIp, readJson } from "@/lib/request";
import { getStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  return NextResponse.json({ ready: adminReady, authenticated: isAdmin(request) });
}

export async function POST(request: NextRequest) {
  if (!adminReady || !adminPassword) {
    return NextResponse.json({ error: "La pantalla de escritura no está configurada." }, { status: 503 });
  }
  const allowed = await allowRequest(getStore(), "admin-login", clientIp(request), {
    limit: 5,
    windowSeconds: 900,
    now: new Date(),
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera 15 minutos." },
      { status: 429 },
    );
  }
  const body = await readJson(request);
  if (!passwordMatches(body.password, adminPassword)) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  setAdminCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminCookie(response);
  return response;
}
