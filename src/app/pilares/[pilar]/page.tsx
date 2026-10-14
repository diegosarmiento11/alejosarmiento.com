import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostList } from "@/components/post-card";
import { openGraphDefaults } from "@/lib/metadata";
import { getPostsByPillar } from "@/lib/posts";
import { pillars, pillarSlugs, site, type PillarSlug } from "@/lib/site";

export function generateStaticParams() {
  return pillarSlugs.map((pilar) => ({ pilar }));
}

function findPillar(slug: string) {
  return slug in pillars ? pillars[slug as PillarSlug] : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/pilares/[pilar]">): Promise<Metadata> {
  const { pilar } = await params;
  const pillar = findPillar(pilar);
  if (!pillar) return {};
  return {
    title: pillar.name,
    description: pillar.description,
    alternates: { canonical: `/pilares/${pilar}` },
    openGraph: {
      ...openGraphDefaults,
      type: "website",
      title: `${pillar.name} · ${site.name}`,
      description: pillar.description,
      url: `/pilares/${pilar}`,
    },
  };
}

// Every pillar is prerendered, so the page reads params directly (see blog/[slug]).
export const instant = false;

export default async function PillarPage({ params }: PageProps<"/pilares/[pilar]">) {
  const { pilar } = await params;
  const pillar = findPillar(pilar);
  if (!pillar) notFound();
  const posts = getPostsByPillar(pilar);

  return (
    <div className="mx-auto max-w-[44rem] px-4 pt-10 sm:px-6 sm:pt-16">
      <nav aria-label="Ruta" className="text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Blog
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        Temas
      </nav>
      <h1 className="mt-4 font-serif text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
        {pillar.name}
      </h1>
      <p className="mt-4 font-serif text-xl leading-relaxed text-muted-foreground">
        {pillar.description}
      </p>
      <div className="mt-8 border-t">
        {posts.length > 0 ? (
          <PostList posts={posts} />
        ) : (
          <p className="py-8 text-muted-foreground">
            Todavía no hay posts de este tema. Suscríbete y te aviso cuando salga el primero.
          </p>
        )}
      </div>
    </div>
  );
}
