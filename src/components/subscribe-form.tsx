"use client";

import { useId, useState } from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { status: "idle" | "sending" | "sent" } | { status: "error"; message: string };

export function SubscribeForm({
  className,
  stacked = false,
}: {
  className?: string;
  stacked?: boolean;
}) {
  const emailId = useId();
  const [state, setState] = useState<State>({ status: "idle" });

  async function subscribe(formData: FormData) {
    setState({ status: "sending" });
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          website: formData.get("website"),
        }),
      });
      const data: { error?: string } = await response.json();
      setState(
        response.ok
          ? { status: "sent" }
          : { status: "error", message: data.error ?? "Algo salió mal. Intenta de nuevo." },
      );
    } catch {
      setState({ status: "error", message: "Sin conexión. Intenta de nuevo." });
    }
  }

  if (state.status === "sent") {
    return (
      <p
        role="status"
        className={cn("flex items-start gap-2 text-[0.95rem] leading-snug", className)}
      >
        <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
        Revisa tu correo y confirma la suscripción. Si no llega, mira en spam.
      </p>
    );
  }

  return (
    <form action={subscribe} className={cn("w-full", className)}>
      <div className={cn("flex flex-col gap-2", !stacked && "sm:flex-row")}>
        <label htmlFor={emailId} className="sr-only">
          Tu correo
        </label>
        <Input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className={cn("h-11 rounded-full bg-card px-4 text-base", !stacked && "sm:flex-1")}
        />
        {/* Honeypot: hidden from people, tempting for bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] size-px opacity-0"
        />
        <Button
          type="submit"
          disabled={state.status === "sending"}
          className="h-11 rounded-full px-5 text-[0.95rem]"
        >
          {state.status === "sending" ? <Loader2Icon className="animate-spin" /> : null}
          Suscribirme
        </Button>
      </div>
      {state.status === "error" ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
