import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";
import { pillars, postPath } from "@/lib/site";

function Meta({ post }: { post: Post }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <span className="font-medium text-brand">{pillars[post.pilar].name}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingMinutes} min de lectura</span>
      {post.draft ? (
        <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
          Borrador
        </span>
      ) : null}
    </p>
  );
}

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <article className="group relative">
      <Meta post={post} />
      <h2 className="mt-3 font-serif text-[2rem] leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">
        <Link href={postPath(post.slug)} prefetch className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h2>
      <p className="mt-4 max-w-2xl font-serif text-xl leading-relaxed text-muted-foreground">
        {post.description}
      </p>
      <p className="mt-5 text-sm font-semibold underline decoration-brand/50 underline-offset-4 group-hover:decoration-brand">
        Leer el post
      </p>
    </article>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group relative py-7">
      <Meta post={post} />
      <h3 className="mt-2 font-serif text-2xl leading-tight font-medium tracking-tight text-balance decoration-brand/50 decoration-1 underline-offset-4 group-hover:underline sm:text-[1.75rem]">
        <Link href={postPath(post.slug)} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">{post.description}</p>
    </article>
  );
}

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="divide-y">
      {posts.map((post) => (
        <li key={post.slug}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
