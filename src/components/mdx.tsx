import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Video } from "@/components/video";
import { SITE_URL } from "@/lib/site";

function Anchor({ href = "", children, ...props }: React.ComponentProps<"a">) {
  const internal = href.startsWith("/") || href.startsWith("#") || href.startsWith(SITE_URL);
  if (internal) {
    return (
      <Link href={href.replace(SITE_URL, "") || "/"} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener" {...props}>
      {children}
    </a>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-l-2 border-brand bg-secondary/70 px-5 py-4 text-[0.95em] [&>*+*]:mt-3">
      {children}
    </div>
  );
}

const components = { a: Anchor, Video, Callout };

export function Mdx({ source }: { source: string }) {
  return (
    <div className="prose">
      <MDXRemote
        source={source}
        components={components}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
      />
    </div>
  );
}
