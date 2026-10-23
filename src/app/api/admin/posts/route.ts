import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-request";
import { POSTS_TAG } from "@/lib/blog";
import {
  cleanPostInput,
  IMPORT_MAX_CHARS,
  mdxToPostInput,
  reviewPost,
  todayInBogota,
  toPostInput,
} from "@/lib/compose-post";
import { deletePost, getPostSource, loadPosts, SLUG_PATTERN, savePost } from "@/lib/posts";
import { readJson } from "@/lib/request";
import { getStore } from "@/lib/store";

const unauthorized = () =>
  NextResponse.json({ error: "Inicia sesión de nuevo." }, { status: 401 });

const notFound = () => NextResponse.json({ error: "Post no encontrado." }, { status: 404 });

// Without ?slug=, the list of posts to pick one for editing; with it, that post.
// With ?download=1, the stored .mdx file as it is, to keep a copy.
// Reads go straight to the store, drafts included, so the editor never sees a cache.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();
  const slug = request.nextUrl.searchParams.get("slug");
  if (slug && request.nextUrl.searchParams.has("download")) {
    const source = SLUG_PATTERN.test(slug) ? await getPostSource(getStore(), slug) : null;
    if (source === null) return notFound();
    return new NextResponse(source, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": `attachment; filename="${slug}.mdx"`,
        "cache-control": "no-store",
      },
    });
  }
  const posts = await loadPosts(getStore(), { includeDrafts: true });
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
  if (!post) return notFound();
  return NextResponse.json({ post: toPostInput(post) });
}

// "import" reads an uploaded .mdx file into the form, saving nothing; if a post
// already lives at its slug, the form edits that post. "check" reviews the post;
// "publish" reviews it again and, if it passes, saves it to the store and expires
// the cached pages so the change shows on the next visit.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();
  const body = await readJson(request);
  if (body.action === "import") {
    if (typeof body.source !== "string" || body.source.length > IMPORT_MAX_CHARS) {
      return NextResponse.json({ error: "El archivo está vacío o es muy grande." }, { status: 400 });
    }
    try {
      const post = mdxToPostInput(body.source, typeof body.fileName === "string" ? body.fileName : "");
      const exists = (await getPostSource(getStore(), post.slug)) !== null;
      return NextResponse.json({ post, editing: exists ? post.slug : null });
    } catch {
      return NextResponse.json({ error: "No se pudo leer el archivo. ¿Es un .mdx?" }, { status: 400 });
    }
  }
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

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!SLUG_PATTERN.test(slug) || !(await deletePost(getStore(), slug, new Date()))) {
    return notFound();
  }
  revalidateTag(POSTS_TAG, { expire: 0 });
  return NextResponse.json({ deleted: slug });
}
