import type { Metadata } from "next";
import { Suspense } from "react";
import { TokenAction } from "@/components/token-action";

export const metadata: Metadata = {
  title: "Moderar comentario",
  robots: { index: false, follow: false },
};

export default function ModeratePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <h1 className="font-serif text-4xl font-medium tracking-tight">Moderar comentario</h1>
      <p className="mx-auto mt-3 mb-8 max-w-md text-muted-foreground">
        El texto del comentario está en el correo que recibiste.
      </p>
      <Suspense>
        <TokenAction
          endpoint="/api/comments/moderate"
          actions={[
            { label: "Aprobar y publicar", value: "approve" },
            { label: "Eliminar", value: "delete", variant: "outline" },
          ]}
          doneMessages={{
            approve: "Comentario publicado.",
            delete: "Comentario eliminado.",
          }}
        />
      </Suspense>
    </div>
  );
}
