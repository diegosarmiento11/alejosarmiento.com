import Link from "next/link";
import { AuthorPhoto } from "@/components/author-photo";
import { SocialLinks } from "@/components/social-links";
import { author } from "@/lib/site";

export function AuthorCard() {
  return (
    <aside
      aria-label="Sobre el autor"
      className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:p-7"
    >
      <AuthorPhoto size={88} />
      <div>
        <p className="text-sm text-muted-foreground">Escrito por</p>
        <p className="font-serif text-2xl font-medium tracking-tight">
          <Link href="/sobre-mi" rel="author" className="hover:underline">
            {author.name}
          </Link>
        </p>
        <p className="mt-2 leading-relaxed text-foreground/85">{author.shortBio}</p>
        <SocialLinks className="mt-4" />
        <p className="mt-4 text-sm text-muted-foreground">
          ¿Colaboramos? Escríbeme a{" "}
          <a
            href={`mailto:${author.email}`}
            className="font-medium text-foreground underline decoration-brand/50 underline-offset-4 hover:decoration-brand"
          >
            {author.email}
          </a>
        </p>
      </div>
    </aside>
  );
}
