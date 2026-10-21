import { type NextRequest, NextResponse } from "next/server";
import { allowRequest, getPostViews, recordPostView } from "@/lib/engagement";
import { postExists } from "@/lib/posts";
import { clientIp, readJson } from "@/lib/request";
import { getStore } from "@/lib/store";

const notFound = () => NextResponse.json({ error: "Post no encontrado." }, { status: 404 });

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!(await postExists(getStore(), slug))) return notFound();
  return NextResponse.json({ views: await getPostViews(getStore(), slug) });
}

export async function POST(request: NextRequest) {
  const { slug } = await readJson(request);
  if (typeof slug !== "string" || !(await postExists(getStore(), slug))) return notFound();

  const store = getStore();
  const allowed = await allowRequest(store, "views", clientIp(request), {
    limit: 60,
    windowSeconds: 3600,
    now: new Date(),
  });
  const views = allowed ? await recordPostView(store, slug) : await getPostViews(store, slug);
  return NextResponse.json({ views });
}
