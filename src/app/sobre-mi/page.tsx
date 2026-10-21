import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "@/components/social-links";
import { profilePageSchema, serializeJsonLd } from "@/lib/jsonld";
import { openGraphDefaults } from "@/lib/metadata";
import { getAllPosts } from "@/lib/blog";
import { author, CLAUDE_COLOMBIA_URL, pillars, postPath, socials } from "@/lib/site";

const title = "Quién es Alejandro Sarmiento, fundador de forabi.ai";
const description =
  "Quién es Alejandro Sarmiento: fundador y CEO de forabi.ai, organizador de Claude Colombia y arquitecto de software. Trayectoria, temas y contacto.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/sobre-mi" },
  openGraph: {
    ...openGraphDefaults,
    type: "profile",
    title,
    description,
    url: "/sobre-mi",
    firstName: "Alejandro",
    lastName: "Sarmiento",
  },
};

const linkClass =
  "underline decoration-brand/50 underline-offset-[0.2em] transition-colors hover:decoration-brand";

export default async function AboutPage() {
  const latest = (await getAllPosts()).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(profilePageSchema()) }}
      />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-10 sm:px-6 sm:pt-16 md:grid-cols-[20rem_1fr] md:gap-14">
        <div className="md:sticky md:top-24 md:self-start">
          <Image
            src={author.photo}
            alt={author.photoAlt}
            width={800}
            height={1200}
            priority
            sizes="(min-width: 768px) 320px, 100vw"
            className="aspect-[4/5] w-full rounded-2xl object-cover object-top"
          />
          <SocialLinks className="mt-4" />
        </div>

        <div>
          <p className="text-sm font-medium text-brand">Sobre mí</p>
          <h1 className="mt-2 font-serif text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">
            {author.name}
          </h1>
          <p className="mt-2 text-muted-foreground">{author.role}</p>

          <div className="prose mt-8">
            <p>
              Soy arquitecto de software. Antes de fundar forabi.ai trabajé 4 años en Hatchworks AI,
              construyendo para Cox Communications y FanDuel.
            </p>
            <p>
              Fundé{" "}
              <a href={socials.forabi.url} target="_blank" rel="noopener" className={linkClass}>
                forabi.ai
              </a>
              , una consultora de software a la medida e integración de IA con sede en Bogotá, para
              llevar esa forma de trabajar a empresas que normalmente no tienen acceso a ella.
            </p>
            <p>
              También organizo{" "}
              <a href={CLAUDE_COLOMBIA_URL} target="_blank" rel="noopener" className={linkClass}>
                Claude Colombia
              </a>
              , una comunidad educativa de IA en español, y comparto lo que aprendo con una
              comunidad de 52K personas en{" "}
              <a href={socials.instagram.url} target="_blank" rel="noopener" className={linkClass}>
                {socials.instagram.handle}
              </a>
              .
            </p>

            <h2>De qué escribo</h2>
            <ul>
              {Object.entries(pillars).map(([slug, pillar]) => (
                <li key={slug}>
                  <Link href={`/pilares/${slug}`}>{pillar.name}</Link>: {pillar.description}
                </li>
              ))}
            </ul>

            <h2>Colaboraciones</h2>
            <p>
              Para charlas, alianzas, entrevistas o proyectos, escríbeme a{" "}
              <a href={`mailto:${author.email}`}>{author.email}</a>. Si lo que buscas es construir
              software o automatizar tu operación con IA, el camino es{" "}
              <a href={socials.forabi.url} target="_blank" rel="noopener">
                forabi.ai
              </a>
              .
            </p>
          </div>

          {latest.length > 0 ? (
            <section aria-labelledby="latest-title" className="mt-12">
              <h2 id="latest-title" className="text-sm font-semibold tracking-wide uppercase">
                Lo último que escribí
              </h2>
              <ul className="mt-3 divide-y border-y">
                {latest.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={postPath(post.slug)}
                      className="block py-3.5 font-serif text-xl leading-snug font-medium decoration-brand/50 underline-offset-4 hover:underline"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
