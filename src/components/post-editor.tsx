"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { CheckIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DESCRIPTION_MAX, slugify, TITLE_MAX } from "@/lib/post-format";
import { linkMap, pillars, pillarSlugs, type PillarSlug } from "@/lib/site";

type Draft = {
  // Slug of the stored post being edited; null for a new one.
  editing: string | null;
  title: string;
  slug: string;
  slugEdited: boolean;
  description: string;
  pilar: PillarSlug;
  keywords: string;
  faq: { question: string; answer: string }[];
  body: string;
  draft: boolean;
};

const EMPTY: Draft = {
  editing: null,
  title: "",
  slug: "",
  slugEdited: false,
  description: "",
  pilar: pillarSlugs[0],
  keywords: "",
  faq: Array.from({ length: 3 }, () => ({ question: "", answer: "" })),
  body: "",
  draft: false,
};

// The unsent draft survives a closed tab on this device only. Storage can be
// unavailable (private mode), so every access is guarded.
const STORAGE_KEY = "escribir:borrador";

function loadDraft(): Draft {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...EMPTY, ...(JSON.parse(saved) as Partial<Draft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function saveDraft(draft: Draft | null) {
  try {
    if (draft) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the draft just won't survive a reload.
  }
}

const LINKS: { label: string; url: string }[] = [
  { label: "IA en operaciones, agentes", url: linkMap.operations },
  { label: "Software a la medida", url: linkMap.customSoftware },
  { label: "Integraciones (Siigo, ERP, CRM)", url: linkMap.integrations },
  { label: "Clínicas e IPS", url: linkMap.health },
  { label: "Casos con clientes", url: linkMap.cases },
  { label: "Quién es forabi", url: linkMap.about },
];

type Session = "loading" | "closed" | "login" | "open";

export function PostEditor() {
  const [session, setSession] = useState<Session>("loading");
  // Stable, because the post picker refetches when it changes.
  const loggedOut = useCallback(() => setSession("login"), []);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((data: { ready: boolean; authenticated: boolean }) =>
        setSession(!data.ready ? "closed" : data.authenticated ? "open" : "login"),
      )
      .catch(() => setSession("login"));
  }, []);

  if (session === "loading") {
    return <Loader2Icon className="mx-auto mt-10 animate-spin text-muted-foreground" />;
  }
  if (session === "closed") {
    return (
      <p className="text-muted-foreground">
        Esta pantalla no está configurada. Faltan ADMIN_PASSWORD o SIGNING_SECRET en Vercel.
      </p>
    );
  }
  if (session === "login") return <LoginForm onDone={() => setSession("open")} />;
  return <Editor onLoggedOut={loggedOut} />;
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function login(formData: FormData) {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: formData.get("password") }),
      });
      const data: { error?: string } = await response.json();
      if (response.ok) onDone();
      else setError(data.error ?? "No se pudo entrar.");
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form action={login} className="mx-auto flex max-w-sm flex-col gap-3">
      <Label htmlFor={id}>Contraseña</Label>
      <Input
        id={id}
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="h-11 text-base"
      />
      <Button type="submit" disabled={sending} className="h-11">
        {sending ? <Loader2Icon className="animate-spin" /> : null}
        Entrar
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}

type Result =
  | { status: "idle" | "checking" | "publishing" }
  | { status: "issues"; issues: string[] }
  | { status: "ok" }
  | { status: "published"; slug: string; draft: boolean; edited: boolean }
  | { status: "error"; message: string };

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={value.length > max ? "text-destructive" : "text-muted-foreground"}>
      {value.length}/{max}
    </span>
  );
}

function Editor({ onLoggedOut }: { onLoggedOut: () => void }) {
  const ids = {
    title: useId(),
    slug: useId(),
    description: useId(),
    keywords: useId(),
    body: useId(),
    draft: useId(),
  };
  // The editor mounts only in the browser, after the session check, so storage is readable here.
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [result, setResult] = useState<Result>({ status: "idle" });

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  function update(patch: Partial<Draft>) {
    setDraft((current) => {
      const next = { ...current, ...patch };
      if (!next.slugEdited) next.slug = slugify(next.title);
      return next;
    });
    if (result.status !== "checking" && result.status !== "publishing") {
      setResult({ status: "idle" });
    }
  }

  function updateFaq(index: number, patch: Partial<Draft["faq"][number]>) {
    update({ faq: draft.faq.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  }

  async function send(action: "check" | "publish") {
    setResult({ status: action === "check" ? "checking" : "publishing" });
    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          editing: draft.editing,
          post: {
            ...draft,
            keywords: draft.keywords.split(/[,\n]/),
          },
        }),
      });
      const data: {
        error?: string;
        issues?: string[];
        slug?: string;
        published?: boolean;
      } = await response.json();

      if (response.status === 401) {
        onLoggedOut();
        return;
      }
      if (!response.ok) {
        setResult({ status: "error", message: data.error ?? "Algo salió mal." });
      } else if (data.issues && data.issues.length > 0) {
        setResult({ status: "issues", issues: data.issues });
      } else if (data.published && data.slug) {
        setResult({
          status: "published",
          slug: data.slug,
          draft: draft.draft,
          edited: draft.editing !== null,
        });
        saveDraft(null);
        setDraft(EMPTY);
      } else {
        setResult({ status: "ok" });
      }
    } catch {
      setResult({ status: "error", message: "Sin conexión. Tu texto sigue guardado aquí." });
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => null);
    onLoggedOut();
  }

  if (result.status === "published") {
    return (
      <div role="status" className="space-y-4">
        <p className="flex items-start gap-2 font-serif text-2xl">
          <CheckIcon className="mt-1.5 size-5 shrink-0 text-brand" />
          {result.draft ? "Borrador guardado." : result.edited ? "Cambios publicados." : "Publicado."}
        </p>
        {result.draft ? (
          <p className="text-muted-foreground">
            No aparece en el sitio hasta que lo edites y quites la marca de borrador.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Ya está en{" "}
            <a className="underline" href={`/blog/${result.slug}`}>
              /blog/{result.slug}
            </a>
            .
          </p>
        )}
        {!result.draft && !result.edited ? (
          <p className="text-sm text-muted-foreground">
            Después: envía la URL a Google Search Console y manda el newsletter.
          </p>
        ) : null}
        <Button variant="outline" onClick={() => setResult({ status: "idle" })}>
          Escribir otro
        </Button>
      </div>
    );
  }

  const busy = result.status === "checking" || result.status === "publishing";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void send("publish");
      }}
      className="space-y-7"
    >
      <PostPicker
        editing={draft.editing}
        onPick={(post) => {
          setDraft(post);
          setResult({ status: "idle" });
        }}
        onLoggedOut={onLoggedOut}
      />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <Label htmlFor={ids.title}>Título</Label>
          <Counter value={draft.title} max={TITLE_MAX} />
        </div>
        <Input
          id={ids.title}
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          placeholder="La pregunta que responde el post"
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={ids.slug} className="text-sm">
          Dirección
        </Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="shrink-0">/blog/</span>
          <Input
            id={ids.slug}
            value={draft.slug}
            onChange={(event) => update({ slug: event.target.value, slugEdited: true })}
            readOnly={draft.editing !== null}
            className="h-9 font-mono text-sm read-only:opacity-60"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <Label htmlFor={ids.description}>Descripción para Google</Label>
          <Counter value={draft.description} max={DESCRIPTION_MAX} />
        </div>
        <Textarea
          id={ids.description}
          value={draft.description}
          onChange={(event) => update({ description: event.target.value })}
          rows={3}
          className="text-base"
        />
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm">Serie</Label>
          <Select
            items={pillarSlugs.map((slug) => ({ value: slug, label: pillars[slug].name }))}
            value={draft.pilar}
            onValueChange={(value) => {
              if (value) update({ pilar: value as PillarSlug });
            }}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pillarSlugs.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {pillars[slug].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={ids.keywords} className="text-sm">
            Palabras clave (3 a 6, separadas por coma)
          </Label>
          <Input
            id={ids.keywords}
            value={draft.keywords}
            onChange={(event) => update({ keywords: event.target.value })}
            className="h-11 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={ids.body} className="text-sm">
          Texto (Markdown: ## para subtítulos, [texto](url) para enlaces)
        </Label>
        <Textarea
          id={ids.body}
          value={draft.body}
          onChange={(event) => update({ body: event.target.value })}
          rows={18}
          placeholder="Primer párrafo: la respuesta en 2 o 3 frases, o la escena con la que abre."
          className="font-serif text-base leading-relaxed"
        />
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Enlaces a forabi.ai</summary>
          <ul className="mt-2 space-y-1">
            {LINKS.map((link) => (
              <li key={link.url}>
                {link.label}: <code className="break-all text-xs">{link.url}</code>
              </li>
            ))}
          </ul>
        </details>
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-medium">Preguntas frecuentes (3 a 5)</legend>
        {draft.faq.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Input
                aria-label={`Pregunta ${index + 1}`}
                value={item.question}
                onChange={(event) => updateFaq(index, { question: event.target.value })}
                placeholder="¿Pregunta que alguien escribiría en Google?"
                className="h-10 text-base"
              />
              {draft.faq.length > 3 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar pregunta ${index + 1}`}
                  onClick={() => update({ faq: draft.faq.filter((_, i) => i !== index) })}
                >
                  <XIcon />
                </Button>
              ) : null}
            </div>
            <Textarea
              aria-label={`Respuesta ${index + 1}`}
              value={item.answer}
              onChange={(event) => updateFaq(index, { answer: event.target.value })}
              placeholder="Respuesta directa en 2 o 3 frases."
              rows={2}
              className="text-base"
            />
          </div>
        ))}
        {draft.faq.length < 5 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update({ faq: [...draft.faq, { question: "", answer: "" }] })}
          >
            <PlusIcon />
            Agregar pregunta
          </Button>
        ) : null}
      </fieldset>

      <div className="flex items-center gap-2">
        <Checkbox
          id={ids.draft}
          checked={draft.draft}
          onCheckedChange={(checked) => update({ draft: checked === true })}
        />
        <Label htmlFor={ids.draft} className="text-sm font-normal">
          Guardar como borrador (no aparece en el sitio)
        </Label>
      </div>

      {result.status === "issues" ? (
        <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
          <p className="mb-2 font-medium">Antes de publicar, corrige:</p>
          <ul className="list-disc space-y-1 pl-5">
            {result.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.status === "ok" ? (
        <p role="status" className="flex items-center gap-2 text-sm">
          <CheckIcon className="size-4 text-brand" />
          Todo en orden. Puedes publicar.
        </p>
      ) : null}
      {result.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {result.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void send("check")}
          className="h-11"
        >
          {result.status === "checking" ? <Loader2Icon className="animate-spin" /> : null}
          Revisar
        </Button>
        <Button type="submit" disabled={busy} className="h-11 sm:flex-1">
          {result.status === "publishing" ? <Loader2Icon className="animate-spin" /> : null}
          {draft.draft ? "Guardar borrador" : draft.editing ? "Publicar cambios" : "Publicar"}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tu texto se guarda en este dispositivo mientras escribes.{" "}
        <button type="button" onClick={() => void logout()} className="underline">
          Cerrar sesión
        </button>
      </p>
    </form>
  );
}

type PostSummary = { slug: string; title: string; draft: boolean };

// Loads a stored post into the form, or clears the form for a new one.
function PostPicker({
  editing,
  onPick,
  onLoggedOut,
}: {
  editing: string | null;
  onPick: (draft: Draft) => void;
  onLoggedOut: () => void;
}) {
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/posts")
      .then((response) => (response.status === 401 ? null : response.json()))
      .then((data: { posts?: PostSummary[] } | null) => {
        if (data === null) onLoggedOut();
        else setPosts(data.posts ?? []);
      })
      .catch(() => setPosts([]));
  }, [onLoggedOut]);

  async function pick(slug: string | null) {
    if (slug === null) {
      onPick(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`);
      const data: {
        post?: Omit<Draft, "keywords" | "slugEdited" | "editing"> & { keywords: string[] };
      } = await response.json();
      if (data.post) {
        onPick({
          ...data.post,
          keywords: data.post.keywords.join(", "),
          slugEdited: true,
          editing: slug,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const NEW = "__nuevo";
  return (
    <div className="space-y-2">
      <Label className="text-sm">Post</Label>
      <Select
        items={[
          { value: NEW, label: "Post nuevo" },
          ...(posts ?? []).map((post) => ({
            value: post.slug,
            label: `${post.title}${post.draft ? " (borrador)" : ""}`,
          })),
        ]}
        value={editing ?? NEW}
        onValueChange={(value) => void pick(value === NEW || !value ? null : String(value))}
        disabled={posts === null || loading}
      >
        <SelectTrigger className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NEW}>Post nuevo</SelectItem>
          {(posts ?? []).map((post) => (
            <SelectItem key={post.slug} value={post.slug}>
              {post.title}
              {post.draft ? " (borrador)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
