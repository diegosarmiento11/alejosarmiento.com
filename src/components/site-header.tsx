import Link from "next/link";
import { AuthorPhoto } from "@/components/author-photo";
import { buttonVariants } from "@/components/ui/button";
import { author } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <AuthorPhoto size={30} priority />
          <span className="truncate font-serif text-lg font-medium tracking-tight">
            {author.name}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/sobre-mi"
            className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sobre mí
          </Link>
          <Link href="#suscribirse" className={buttonVariants({ size: "lg", className: "rounded-full px-4" })}>
            Suscribirme
          </Link>
        </nav>
      </div>
    </header>
  );
}
