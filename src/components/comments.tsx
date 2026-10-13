"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMENT_BODY_MAX,
  COMMENT_NAME_MAX,
  type PublicComment,
} from "@/lib/engagement";

const dateFormat = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type FormState =
  | { status: "idle" | "sending" | "pending" }
  | { status: "error"; message: string };

export function Comments({ slug }: { slug: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [form, setForm] = useState<FormState>({ status: "idle" });

  useEffect(() => {
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { enabled: boolean; comments: PublicComment[] } | null) => {
        setEnabled(Boolean(data?.enabled));
        setComments(data?.comments ?? []);
      })
      .catch(() => setEnabled(false));
  }, [slug]);

  async function submit(formData: FormData) {
    setForm({ status: "sending" });
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          name: formData.get("name"),
          body: formData.get("body"),
          website: formData.get("website"),
        }),
      });
      const data: { status?: string; comment?: PublicComment; error?: string } =
        await response.json();
      if (!response.ok) {
        setForm({ status: "error", message: data.error ?? "No pudimos enviar tu comentario." });
        return;
      }
      if (data.comment) {
        setComments((current) => [...current, data.comment!]);
        setForm({ status: "idle" });
      } else {
        setForm({ status: "pending" });
      }
    } catch {
      setForm({ status: "error", message: "Sin conexión. Intenta de nuevo." });
    }
  }

  // Closed (or still loading): render nothing rather than an empty shell.
  if (!enabled) return null;

  return (
    <section aria-labelledby="comments-title">
      <h2 id="comments-title" className="font-serif text-3xl font-medium tracking-tight">
        Comentarios{comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {comments.length > 0 ? (
        <ul className="mt-5 space-y-6">
          {comments.map((comment) => (
            <li key={comment.id} className="border-l-2 pl-4">
              <p className="text-sm">
                <span className="font-semibold">{comment.name}</span>{" "}
                <time dateTime={comment.createdAt} className="text-muted-foreground">
                  · {dateFormat.format(new Date(comment.createdAt))}
                </time>
              </p>
              <p className="mt-1 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted-foreground">Sé la primera persona en comentar.</p>
      )}

      {form.status === "pending" ? (
        <p role="status" className="mt-6 rounded-xl border bg-card p-4 leading-relaxed">
          Gracias. Tu comentario aparecerá cuando lo revise.
        </p>
      ) : (
        <form action={submit} className="mt-6 space-y-3">
          <div>
            <label htmlFor="comment-name" className="sr-only">
              Tu nombre
            </label>
            <Input
              id="comment-name"
              name="name"
              required
              minLength={2}
              maxLength={COMMENT_NAME_MAX}
              autoComplete="name"
              placeholder="Tu nombre"
              className="h-11 bg-card px-3.5 text-base sm:max-w-xs"
            />
          </div>
          <div>
            <label htmlFor="comment-body" className="sr-only">
              Tu comentario
            </label>
            <Textarea
              id="comment-body"
              name="body"
              required
              minLength={3}
              maxLength={COMMENT_BODY_MAX}
              rows={4}
              placeholder="¿Qué piensas? ¿Qué te gustaría que explicara mejor?"
              className="bg-card px-3.5 py-3 text-base"
            />
          </div>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] size-px opacity-0"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={form.status === "sending"}
              className="h-10 rounded-full px-5"
            >
              {form.status === "sending" ? <Loader2Icon className="animate-spin" /> : null}
              Comentar
            </Button>
            <p className="text-sm text-muted-foreground">
              Reviso cada comentario antes de publicarlo.
            </p>
          </div>
          {form.status === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {form.message}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
