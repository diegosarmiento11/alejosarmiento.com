import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorCard } from "@/components/author-card";
import { AuthorPhoto } from "@/components/author-photo";
import { Comments } from "@/components/comments";
import { Faq } from "@/components/faq";
import { Mdx } from "@/components/mdx";
import { PostList } from "@/components/post-card";
import { PostViews } from "@/components/post-views";
import { Reactions } from "@/components/reactions";
import { ShareButtons } from "@/components/share-buttons";
import { postGraph, serializeJsonLd } from "@/lib/jsonld";
import { formatDate, getAllPosts, getPost, getRelatedPosts } from "@/lib/posts";
import { absoluteUrl, author, pillars, postPath, site } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const path = postPath(post.slug);
  return {
    title: { absolute: post.title },
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: path },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      url: path,
      siteName: site.name,
      locale: site.locale,
      title: post.title,
      description: post.description,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [absoluteUrl("/sobre-mi")],
      section: pillars[post.pilar].name,
      tags: post.keywords,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

// Every published slug is prerendered, so the page reads params directly and
// opts out of the instant-navigation check. An unknown slug renders the
// not-found UI with noindex; its status stays 200 because the shell streams first.
export const instant = false;

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = absoluteUrl(postPath(post.slug));
  const related = getRelatedPosts(post);
  const updated = post.dateModified !== post.datePublished;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(postGraph(post)) }}
      />
      <article className="mx-auto max-w-[44rem] px-4 pt-10 sm:px-6 sm:pt-16">
        <header>
          <nav aria-label="Ruta" className="text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Blog
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <Link href={`/pilares/${post.pilar}`} className="font-medium text-brand hover:underline">
              {pillars[post.pilar].name}
            </Link>
          </nav>

          <h1 className="mt-4 font-serif text-[2.25rem] leading-[1.08] font-medium tracking-tight text-balance sm:text-[3.25rem]">
            {post.title}
          </h1>
          <p className="mt-4 font-serif text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            {post.description}
          </p>

          <div className="mt-7 flex items-center gap-3">
            <AuthorPhoto size={48} priority />
            <div className="min-w-0 text-sm leading-snug">
              <p className="font-semibold">
                <Link href="/sobre-mi" rel="author" className="hover:underline">
                  {author.name}
                </Link>
                <span className="font-normal text-muted-foreground"> · {author.jobTitle} de forabi.ai</span>
              </p>
              <p className="flex flex-wrap gap-x-2 text-muted-foreground">
                <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                <span aria-hidden="true">·</span>
                <span>{post.readingMinutes} min de lectura</span>
                <PostViews slug={post.slug} />
              </p>
            </div>
          </div>

          <div className="mt-6 border-y py-3">
            <ShareButtons url={url} title={post.title} storyImagePath={`${postPath(post.slug)}/story`} />
          </div>
        </header>

        <div className="mt-9">
          <Mdx source={post.content} />
        </div>

        {updated ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Actualizado el <time dateTime={post.dateModified}>{formatDate(post.dateModified)}</time>.
          </p>
        ) : null}

        <div className="mt-14 space-y-14">
          <Faq items={post.faq} />

          <div className="rounded-2xl border bg-card px-5 py-8 sm:px-8">
            <Reactions slug={post.slug} />
            <div className="mt-7 flex flex-col items-center gap-3 border-t pt-6">
              <p className="text-sm text-muted-foreground">¿Le sirve a alguien más? Compártelo.</p>
              <ShareButtons url={url} title={post.title} storyImagePath={`${postPath(post.slug)}/story`} />
            </div>
          </div>

          <AuthorCard />
          <Comments slug={post.slug} />
        </div>
      </article>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="mx-auto mt-16 max-w-[44rem] px-4 sm:px-6">
          <h2 id="related-title" className="border-b pb-3 text-sm font-semibold tracking-wide uppercase">
            Sigue leyendo
          </h2>
          <PostList posts={related} />
        </section>
      ) : null}
    </>
  );
}
