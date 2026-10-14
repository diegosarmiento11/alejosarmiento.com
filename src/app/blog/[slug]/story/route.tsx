import { renderStoryImage } from "@/lib/og";
import { getAllPosts, getPost } from "@/lib/posts";
import { pillars } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// 1080×1920 image for Instagram Stories.
export async function GET(_request: Request, { params }: RouteContext<"/blog/[slug]/story">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  return renderStoryImage({ label: pillars[post.pilar].name, title: post.title });
}
