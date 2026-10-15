import Link from "next/link";
import { SiteVisits } from "@/components/site-visits";
import { SocialLinks } from "@/components/social-links";
import { SubscribeForm } from "@/components/subscribe-form";
import { author, pillars } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <section id="suscribirse" className="border-b bg-secondary/60">
        <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            Recibe cada post nuevo en tu correo
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Diario de fundador, entrenamiento y software con IA, sin humo. Un correo cuando publico, nada más.
          </p>
          <SubscribeForm className="mx-auto mt-6 max-w-md text-left" />
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-xl font-medium tracking-tight">{author.name}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {author.tagline}
          </p>
          <SocialLinks className="mt-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Temas</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {Object.entries(pillars).map(([slug, pillar]) => (
              <li key={slug}>
                <Link href={`/pilares/${slug}`} className="transition-colors hover:text-foreground">
                  {pillar.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/sobre-mi" className="transition-colors hover:text-foreground">
                Sobre mí
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Colaboraciones</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Charlas, alianzas y proyectos:
          </p>
          <a
            href={`mailto:${author.email}`}
            className="mt-1 inline-block text-sm font-medium underline decoration-brand/50 underline-offset-4 hover:decoration-brand"
          >
            {author.email}
          </a>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {author.name}. Escrito en {author.location}.
          </p>
          <div className="flex items-center gap-4">
            <SiteVisits />
            <a href="/rss.xml" className="transition-colors hover:text-foreground">
              RSS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
