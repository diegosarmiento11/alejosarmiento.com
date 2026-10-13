import Link from "next/link";
import { AuthorPhoto } from "@/components/author-photo";
import { FeaturedPost, PostList } from "@/components/post-card";
import { SocialLinks } from "@/components/social-links";
import { SubscribeForm } from "@/components/subscribe-form";
import { getAllPosts } from "@/lib/posts";
import { author, pillars } from "@/lib/site";

export default function HomePage() {
  const [featured, ...rest] = getAllPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Compact introduction: who writes, and how to follow. The posts lead. */}
      <section
        aria-label="Sobre el autor"
        className="grid gap-6 border-b py-8 sm:py-10 md:grid-cols-[1fr_22rem] md:items-center md:gap-12"
      >
        <div className="flex items-start gap-4 sm:gap-5">
          <AuthorPhoto size={84} priority />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl leading-tight font-medium tracking-tight sm:text-3xl">
              {author.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{author.role}</p>
            <p className="mt-2.5 max-w-xl leading-relaxed text-foreground/85">
              {author.tagline}{" "}
              <Link
                href="/sobre-mi"
                className="font-medium whitespace-nowrap underline decoration-brand/50 underline-offset-4 hover:decoration-brand"
              >
                Más sobre mí
              </Link>
            </p>
            <SocialLinks className="mt-3.5" />
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-serif text-xl leading-snug font-medium tracking-tight">
            Recibe cada post nuevo en tu correo
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Un correo cuando publico. Nada más.</p>
          <SubscribeForm stacked className="mt-3.5" />
        </div>
      </section>

      {featured ? (
        <>
          <section aria-label="Último post" className="border-b py-10 sm:py-14">
            <FeaturedPost post={featured} />
          </section>

          <div className="grid gap-10 pt-8 md:grid-cols-[1fr_15rem] md:gap-14">
            <section aria-labelledby="posts-title">
              <h2 id="posts-title" className="text-sm font-semibold tracking-wide uppercase">
                Más posts
              </h2>
              {rest.length > 0 ? (
                <PostList posts={rest} />
              ) : (
                <p className="py-7 text-muted-foreground">
                  Este es el primero. Suscríbete y te aviso cuando salga el siguiente.
                </p>
              )}
            </section>

            <aside aria-labelledby="pillars-title" className="md:sticky md:top-24 md:self-start">
              <h2 id="pillars-title" className="text-sm font-semibold tracking-wide uppercase">
                Temas
              </h2>
              <ul className="mt-4 space-y-4">
                {Object.entries(pillars).map(([slug, pillar]) => (
                  <li key={slug}>
                    <Link href={`/pilares/${slug}`} className="group block">
                      <span className="font-serif text-lg font-medium decoration-brand/50 underline-offset-4 group-hover:underline">
                        {pillar.name}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                        {pillar.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </>
      ) : (
        <p className="py-16 text-center font-serif text-xl text-muted-foreground">
          El primer post está en camino.
        </p>
      )}
    </div>
  );
}
