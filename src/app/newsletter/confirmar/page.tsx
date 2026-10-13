import type { Metadata } from "next";
import { Suspense } from "react";
import { TokenAction } from "@/components/token-action";

export const metadata: Metadata = {
  title: "Confirma tu suscripción",
  robots: { index: false, follow: false },
};

export default function ConfirmPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <h1 className="font-serif text-4xl font-medium tracking-tight">Un clic y quedas dentro</h1>
      <p className="mx-auto mt-3 mb-8 max-w-md text-muted-foreground">
        Confirma para recibir cada post nuevo en tu correo.
      </p>
      <Suspense>
        <TokenAction
          endpoint="/api/subscribe/confirm"
          actions={[{ label: "Confirmar suscripción", value: "confirm" }]}
          doneMessages={{ confirm: "Listo, ya estás suscrito. Nos leemos en el próximo post." }}
        />
      </Suspense>
    </div>
  );
}
