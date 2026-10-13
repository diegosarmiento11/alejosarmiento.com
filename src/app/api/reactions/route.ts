import { type NextRequest, NextResponse } from "next/server";
import { allowRequest, getReactions, isReaction, setReaction } from "@/lib/engagement";
import { postExists } from "@/lib/posts";
import {
  clientIp,
  ensureVisitorId,
  readJson,
  readVisitorId,
  setVisitorCookie,
} from "@/lib/request";
import { getStore } from "@/lib/store";

const notFound = () => NextResponse.json({ error: "Post no encontrado." }, { status: 404 });

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!postExists(slug)) return notFound();
  return NextResponse.json(await getReactions(getStore(), slug, readVisitorId(request)));
}

export async function POST(request: NextRequest) {
  const { slug, reaction } = await readJson(request);
  if (typeof slug !== "string" || !postExists(slug)) return notFound();
  if (reaction !== null && !isReaction(reaction)) {
    return NextResponse.json({ error: "Reacción no válida." }, { status: 400 });
  }

  const store = getStore();
  const allowed = await allowRequest(store, "reactions", clientIp(request), {
    limit: 30,
    windowSeconds: 600,
    now: new Date(),
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas reacciones seguidas. Intenta en unos minutos." },
      { status: 429 },
    );
  }

  const visitor = ensureVisitorId(request);
  const response = NextResponse.json(await setReaction(store, slug, visitor.id, reaction));
  if (visitor.isNew) setVisitorCookie(response, visitor.id);
  return response;
}
