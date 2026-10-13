"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Action = { label: string; value: string; variant?: "default" | "outline" };
type State =
  | { status: "idle" | "sending" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

// Reads ?token= and POSTs it only when the person clicks. Links from email are
// often opened by security scanners, so nothing happens on page load.
export function TokenAction({
  endpoint,
  actions,
  doneMessages,
}: {
  endpoint: string;
  actions: Action[];
  doneMessages: Record<string, string>;
}) {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>({ status: "idle" });

  if (!token) {
    return <p className="text-muted-foreground">Este enlace no es válido.</p>;
  }
  if (state.status === "done") {
    return (
      <p role="status" className="font-serif text-xl">
        {state.message}
      </p>
    );
  }

  async function run(action: string) {
    setState({ status: "sending" });
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data: { error?: string } = await response.json();
      setState(
        response.ok
          ? { status: "done", message: doneMessages[action] ?? "Listo." }
          : { status: "error", message: data.error ?? "Algo salió mal." },
      );
    } catch {
      setState({ status: "error", message: "Sin conexión. Intenta de nuevo." });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {actions.map((action) => (
          <Button
            key={action.value}
            variant={action.variant ?? "default"}
            disabled={state.status === "sending"}
            onClick={() => run(action.value)}
            className="h-11 rounded-full px-6 text-[0.95rem]"
          >
            {state.status === "sending" ? <Loader2Icon className="animate-spin" /> : null}
            {action.label}
          </Button>
        ))}
      </div>
      {state.status === "error" ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
