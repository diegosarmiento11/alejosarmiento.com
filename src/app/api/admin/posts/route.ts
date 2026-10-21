import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-request";
import { POSTS_TAG } from "@/lib/blog";
import { cleanPostInput, reviewPost, todayInBogota, toPostInput } from "@/lib/compose-post";
import { loadPosts, savePost } from "@/lib/posts";
import { readJson } from "@/lib/request";
import { getStore } from "@/lib/store";

const unauthorized = () =>
  NextResponse.json({ error: "Inicia sesión de nuevo." }, { status: 401 });

// Without ?slug=, the list of posts to pick one for editing; with it, that post.
// Reads go straight to the store, drafts included, so the editor never sees a cache.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();
  const posts = await loadPosts(getStore(), { includeDrafts: true });
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({
      posts: posts.map(({ slug, title, draft, dateModified }) => ({
        slug,
        title,
        draft,
        dateModified,
      })),
    });
  }
  const post = posts.find((item) => item.slug === slug);
  if (!post) return NextResponse.json({ error: "Post no encontrado." }, { status: 404 });
  return NextResponse.json({ post: toPostInput(post) });
}

// "check" reviews the post; "publish" reviews it again and, if it passes, saves it
// to the store and expires the cached pages so the change shows on the next visit.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();
  const body = await readJson(request);
  const input = cleanPostInput(body.post, {
    editing: typeof body.editing === "string" ? body.editing : undefined,
  });
  const store = getStore();
  const all = await loadPosts(store, { includeDrafts: true });

  const editing =
    typeof body.editing === "string" ? all.find((post) => post.slug === body.editing) : undefined;
  if (typeof body.editing === "string" && !editing) {
    return NextResponse.json({ error: "El post que editabas ya no existe." }, { status: 404 });
  }

  const now = new Date();
  const review = reviewPost(input, all, { today: todayInBogota(now), editing });
  if (body.action !== "publish" || review.issues.length > 0) {
    return NextResponse.json({ slug: input.slug, issues: review.issues });
  }

  await savePost(store, input.slug, review.mdx, now);
  revalidateTag(POSTS_TAG, { expire: 0 });
  return NextResponse.json({ slug: input.slug, issues: [], published: true });
}
