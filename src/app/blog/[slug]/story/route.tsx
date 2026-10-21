import { renderStoryImage } from "@/lib/og";
import { getPost, postSlugParams } from "@/lib/blog";
import { pillars } from "@/lib/site";

export function generateStaticParams() {
  return postSlugParams();
}

// 1080×1920 image for Instagram Stories.
export async function GET(_request: Request, { params }: RouteContext<"/blog/[slug]/story">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  return renderStoryImage({ label: pillars[post.pilar].name, title: post.title });
}
