import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-medium text-brand">Error 404</p>
      <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">
        Esta página no existe
      </h1>
      <p className="mt-3 text-muted-foreground">
        Puede que el enlace esté mal escrito o que el post haya cambiado de dirección.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-7 h-11 rounded-full px-6" })}>
        Ir al blog
      </Link>
    </div>
  );
}
