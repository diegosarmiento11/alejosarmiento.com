"use client";

import { useEffect, useState } from "react";
import { HeartIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import type { Reaction, ReactionCounts } from "@/lib/engagement";

const OPTIONS: { value: Reaction; label: string; Icon: typeof HeartIcon }[] = [
  { value: "like", label: "Me gusta", Icon: ThumbsUpIcon },
  { value: "love", label: "Me encanta", Icon: HeartIcon },
  { value: "dislike", label: "No me gustó", Icon: ThumbsDownIcon },
];

type State = { counts: ReactionCounts; mine: Reaction | null };
const EMPTY: State = { counts: { like: 0, love: 0, dislike: 0 }, mine: null };

// Mirrors setReaction on the server so the click feels instant.
function applyLocally(state: State, clicked: Reaction): State {
  const counts = { ...state.counts };
  const next = state.mine === clicked ? null : clicked;
  if (state.mine) counts[state.mine] = Math.max(0, counts[state.mine] - 1);
  if (next) counts[next] += 1;
  return { counts, mine: next };
}

export function Reactions({ slug }: { slug: string }) {
  const [state, setState] = useState<State>(EMPTY);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: State | null) => {
        if (data) setState(data);
      })
      .catch(() => {});
  }, [slug]);

  async function react(clicked: Reaction) {
    if (pending) return;
    const before = state;
    const optimistic = applyLocally(state, clicked);
    setState(optimistic);
    setPending(true);
    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, reaction: optimistic.mine }),
      });
      const data: State & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState({ counts: data.counts, mine: data.mine });
    } catch (error) {
      setState(before);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "No pudimos guardar tu reacción.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="reactions-title" className="text-center">
      <h2 id="reactions-title" className="font-serif text-2xl font-medium tracking-tight">
        ¿Qué te pareció?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tu reacción me dice sobre qué escribir más.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = state.mine === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => react(value)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border bg-card px-4 text-[0.95rem] font-medium transition-all outline-none hover:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]",
                active && "border-foreground bg-foreground text-background hover:border-foreground",
              )}
            >
              <Icon
                className={cn("size-[1.05rem]", active && value === "love" && "fill-current")}
              />
              <span>{label}</span>
              <span
                className={cn(
                  "min-w-[1ch] tabular-nums text-muted-foreground",
                  active && "text-background/70",
                )}
              >
                {state.counts[value]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
