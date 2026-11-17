"use client";

import { CircleAlertIcon, CircleCheckIcon, CircleDotIcon, CircleIcon, CircleXIcon, MapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CheckStatus, Insights } from "@/lib/post-insights";
import { cn } from "cn";

// The right-hand panel of /escribir: the writing guide for this post, then the
// AEO, AIO, GEO and SEO checks, all live (src/lib/post-insights.ts).

const STATUS_ICON: Record<CheckStatus, typeof CircleCheckIcon> = {
  ok: CircleCheckIcon,
  warn: CircleAlertIcon,
  fail: CircleXIcon,
};

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok: "text-brand",
  warn: "text-amber-600",
  fail: "text-destructive",
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  ok: "Cumple",
  warn: "Recomendado",
  fail: "Bloquea la publicación",
};

export function scoreOf(insights: Insights): { passed: number; total: number; blocking: number } {
  const checks = insights.groups.flatMap((group) => group.checks);
  return {
    passed: checks.filter((check) => check.status === "ok").length,
    total: checks.length,
    blocking: checks.filter((check) => check.status === "fail").length,
  };
}

export function InsightsPanel({
  insights,
  onUseStructure,
}: {
  insights: Insights;
  // Present only while the body is empty.
  onUseStructure?: () => void;
}) {
  const nextStep = insights.steps.find((step) => !step.done);
  const done = insights.steps.filter((step) => step.done).length;
  const score = scoreOf(insights);

  return (
    <div className="space-y-6 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-medium">
          {score.passed}/{score.total} chequeos
        </p>
        <p className="text-xs text-muted-foreground">
          {insights.words.toLocaleString("es-CO")} palabras
          {insights.words > 0 ? ` · ${Math.max(1, Math.round(insights.words / 220))} min` : ""}
        </p>
      </div>

      <section aria-labelledby="hoja-de-ruta" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="hoja-de-ruta" className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <MapIcon className="size-3.5" aria-hidden /> Hoja de ruta
          </h2>
          <span className="text-xs text-muted-foreground">
            {done}/{insights.steps.length}
          </span>
        </div>
        {onUseStructure ? (
          <button
            type="button"
            onClick={onUseStructure}
            className="w-full rounded-lg border border-dashed px-3 py-2 text-left text-sm hover:bg-muted"
          >
            <span className="font-medium">Usar la estructura sugerida</span>
            <span className="block text-xs text-muted-foreground">
              Subtítulos y textos guía (✎) según la serie. Reemplázalos antes de publicar.
            </span>
          </button>
        ) : null}
        <ol className="space-y-1">
          {insights.steps.map((step) => {
            const current = step === nextStep;
            const Icon = step.done ? CircleCheckIcon : current ? CircleDotIcon : CircleIcon;
            return (
              <li
                key={step.id}
                className={cn("flex gap-2.5 rounded-lg px-2 py-1.5", current && "bg-secondary")}
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    step.done ? "text-brand" : current ? "text-foreground" : "text-muted-foreground/60",
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className={cn(step.done && "text-muted-foreground line-through decoration-muted-foreground/40")}>
                    <span className="sr-only">{step.done ? "Hecho: " : "Pendiente: "}</span>
                    {step.label}
                  </p>
                  {current ? <p className="text-xs text-muted-foreground">{step.hint}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {insights.groups.map((group) => {
        const passed = group.checks.filter((check) => check.status === "ok").length;
        const blocking = group.checks.some((check) => check.status === "fail");
        return (
          <details key={group.id} open className="group space-y-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <span>
                <span className="text-xs font-medium uppercase">{group.name}</span>
                <span className="block text-xs text-muted-foreground">{group.about}</span>
              </span>
              <Badge variant={blocking ? "destructive" : passed === group.checks.length ? "secondary" : "outline"}>
                {passed}/{group.checks.length}
              </Badge>
            </summary>
            <ul className="space-y-2 pt-1">
              {group.checks.map((check) => {
                const Icon = STATUS_ICON[check.status];
                return (
                  <li key={check.id} className="flex gap-2.5">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", STATUS_COLOR[check.status])} aria-hidden />
                    <div className="min-w-0">
                      <p>
                        <span className="sr-only">{STATUS_LABEL[check.status]}: </span>
                        {check.label}
                      </p>
                      {check.status !== "ok" ? (
                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}

      <p className="text-xs text-muted-foreground">
        <CircleXIcon className="mr-1 inline size-3 text-destructive" aria-hidden />
        bloquea la publicación ·{" "}
        <CircleAlertIcon className="mx-1 inline size-3 text-amber-600" aria-hidden />
        recomendado por la guía del blog
      </p>
    </div>
  );
}
