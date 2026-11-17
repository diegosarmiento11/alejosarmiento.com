"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { BlockEditor } from "@/components/escribir/block-editor";
import { InsightsPanel, scoreOf } from "@/components/escribir/insights-panel";
import { OPT_OUT_KEY, shareChannels, shareUrl } from "@/lib/analytics";
import { DESCRIPTION_MAX, slugify, TITLE_MAX } from "@/lib/post-format";
import { analyzePost, suggestedStructure } from "@/lib/post-insights";
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

// What the API sends for a post, as the form holds it.
type PostFields = Omit<Draft, "keywords" | "slugEdited" | "editing"> & { keywords: string[] };

function toDraft(post: PostFields, editing: string | null): Draft {
  return { ...EMPTY, ...post, keywords: post.keywords.join(", "), slugEdited: true, editing };
}

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

// Once the author signs in here, this device stops counting in Vercel Web Analytics.
function excludeFromAnalytics() {
  try {
    window.localStorage.setItem(OPT_OUT_KEY, "1");
  } catch {
    // Without storage, only the /escribir visits themselves are left out.
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
    slug: useId(),
    description: useId(),
    keywords: useId(),
  };
  // The editor mounts only in the browser, after the session check, so storage is readable here.
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [result, setResult] = useState<Result>({ status: "idle" });
  // The block editor reads its body once; bumping this loads another one into it.
  const [bodyVersion, setBodyVersion] = useState(0);
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  // Bumped when a post is deleted, so the list reloads.
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(excludeFromAnalytics, []);

  useEffect(() => {
    fetch("/api/admin/posts")
      .then((response) => (response.status === 401 ? null : response.json()))
      .then((data: { posts?: PostSummary[] } | null) => {
        if (data === null) onLoggedOut();
        else setPosts(data.posts ?? []);
      })
      .catch(() => setPosts([]));
  }, [onLoggedOut, listVersion]);

  const keywords = draft.keywords
    .split(/[,\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const insights = useMemo(
    () =>
      analyzePost(
        { ...draft, keywords },
        (posts ?? []).filter((post) => post.slug !== draft.editing),
      ),
    // keywords is derived from draft.keywords.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, posts],
  );
  const score = scoreOf(insights);

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

  // Swaps in a whole post (picked, uploaded, new) and reloads the block editor with it.
  function replace(next: Draft) {
    setDraft(next);
    setBodyVersion((version) => version + 1);
    setResult({ status: "idle" });
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
        body: JSON.stringify({ action, editing: draft.editing, post: { ...draft, keywords } }),
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
        setBodyVersion((version) => version + 1);
        setListVersion((version) => version + 1);
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
      <div role="status" className="mx-auto max-w-2xl space-y-4">
        <p className="flex items-start gap-2 font-serif text-2xl">
          <CheckIcon className="mt-1.5 size-5 shrink-0 text-brand" />
          {result.draft ? "Borrador guardado." : result.edited ? "Cambios publicados." : "Publicado."}
        </p>
        {result.draft ? (
          <p className="text-muted-foreground">
            No aparece en el sitio hasta que lo edites y lo marques como publicado.
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
        {!result.draft ? <ShareLinks slug={result.slug} /> : null}
        <Button variant="outline" onClick={() => setResult({ status: "idle" })}>
          Escribir otro
        </Button>
      </div>
    );
  }

  const busy = result.status === "checking" || result.status === "publishing";
  const panel = (
    <InsightsPanel
      insights={insights}
      onUseStructure={
        draft.body.trim() === ""
          ? () => replace({ ...draft, body: suggestedStructure(draft.pilar) })
          : undefined
      }
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-10 xl:gap-14">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send("publish");
        }}
        className="min-w-0 pb-24 lg:pb-0"
      >
        <div className="flex flex-wrap items-center gap-2 border-b pb-4">
          <PostPicker
            editing={draft.editing}
            posts={posts}
            onPick={replace}
          />
          <PostFiles
            editing={draft.editing}
            title={draft.title}
            onImported={(post) => {
              replace(post);
              toast(post.editing ? "Archivo cargado sobre el post que ya existe." : "Archivo cargado.", {
                description: "Revísalo y publícalo cuando esté listo.",
              });
            }}
            onDeleted={() => {
              replace(EMPTY);
              setListVersion((version) => version + 1);
              toast("Post eliminado.");
            }}
            onLoggedOut={onLoggedOut}
          />
        </div>

        <div className="mx-auto max-w-2xl pt-10">
          <div className="group relative">
            <textarea
              aria-label="Título"
              value={draft.title}
              onChange={(event) => update({ title: event.target.value.replace(/\n/g, " ") })}
              placeholder="Sin título"
              rows={1}
              className="field-sizing-content w-full resize-none bg-transparent font-serif text-4xl font-medium leading-tight tracking-tight outline-none placeholder:text-muted-foreground/50"
            />
            <span className="absolute -bottom-5 right-0 text-xs">
              <Counter value={draft.title} max={TITLE_MAX} />
            </span>
          </div>

          <dl className="mt-8 grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
            <Property label="Estado">
              <Select
                items={[
                  { value: "publicado", label: "Publicado" },
                  { value: "borrador", label: "Borrador" },
                ]}
                value={draft.draft ? "borrador" : "publicado"}
                onValueChange={(value) => update({ draft: value === "borrador" })}
              >
                <SelectTrigger className="h-8 w-auto border-transparent px-2 shadow-none hover:border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publicado">Publicado</SelectItem>
                  <SelectItem value="borrador">Borrador (no aparece en el sitio)</SelectItem>
                </SelectContent>
              </Select>
            </Property>
            <Property label="Serie">
              <Select
                items={pillarSlugs.map((slug) => ({ value: slug, label: pillars[slug].name }))}
                value={draft.pilar}
                onValueChange={(value) => {
                  if (value) update({ pilar: value as PillarSlug });
                }}
              >
                <SelectTrigger className="h-8 w-auto border-transparent px-2 shadow-none hover:border-input">
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
            </Property>
            <Property label="Dirección" htmlFor={ids.slug}>
              <div className="flex items-center text-muted-foreground">
                <span className="shrink-0 pl-2">/blog/</span>
                <Input
                  id={ids.slug}
                  value={draft.slug}
                  onChange={(event) => update({ slug: event.target.value, slugEdited: true })}
                  readOnly={draft.editing !== null}
                  className="h-8 border-transparent px-1 font-mono text-sm shadow-none hover:border-input read-only:opacity-60"
                />
              </div>
            </Property>
            <Property label="Palabras clave" htmlFor={ids.keywords}>
              <Input
                id={ids.keywords}
                value={draft.keywords}
                onChange={(event) => update({ keywords: event.target.value })}
                placeholder="La principal primero, separadas por coma"
                className="h-8 border-transparent px-2 shadow-none hover:border-input"
              />
            </Property>
            <Property label="Descripción" htmlFor={ids.description} top>
              <Textarea
                id={ids.description}
                value={draft.description}
                onChange={(event) => update({ description: event.target.value })}
                placeholder="Lo que Google muestra debajo del título"
                rows={2}
                className="min-h-0 border-transparent px-2 py-1.5 shadow-none hover:border-input"
              />
              <span className="block px-2 text-right text-xs">
                <Counter value={draft.description} max={DESCRIPTION_MAX} />
              </span>
            </Property>
          </dl>

          <div className="mt-6 border-t pt-8">
            <BlockEditor
              key={bodyVersion}
              initialBody={draft.body}
              onChange={(body) => update({ body })}
            />
            <details className="mt-2 text-sm text-muted-foreground">
              <summary className="cursor-pointer">Enlaces a forabi.ai</summary>
              <ul className="mt-2 space-y-1">
                {LINKS.map((link) => (
                  <li key={link.url}>
                    {link.label}: <code className="break-all text-xs">{link.url}</code>
                  </li>
                ))}
                <li>
                  Tu serie: <code className="text-xs">/pilares/{draft.pilar}</code>
                </li>
              </ul>
            </details>
          </div>

          <fieldset className="mt-10 space-y-3 border-t pt-8">
            <legend className="sr-only">Preguntas frecuentes</legend>
            <div>
              <h2 className="font-serif text-xl font-medium" aria-hidden>
                Preguntas frecuentes
              </h2>
              <p className="text-sm text-muted-foreground">
                De 3 a 5. Se pintan al final del post y salen en Google como FAQ.
              </p>
            </div>
            {draft.faq.map((item, index) => (
              <div key={index} className="group/faq space-y-1 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Pregunta ${index + 1}`}
                    value={item.question}
                    onChange={(event) => updateFaq(index, { question: event.target.value })}
                    placeholder="¿Pregunta que alguien escribiría en Google?"
                    className="h-9 border-transparent px-1 font-medium shadow-none hover:border-input"
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
                  className="min-h-0 border-transparent px-1 shadow-none hover:border-input"
                />
              </div>
            ))}
            {draft.faq.length < 5 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => update({ faq: [...draft.faq, { question: "", answer: "" }] })}
              >
                <PlusIcon />
                Agregar pregunta
              </Button>
            ) : null}
          </fieldset>

          <div className="mt-10 space-y-4 border-t pt-6">
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
            {draft.editing && !draft.draft ? (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">Enlaces para compartir</summary>
                <div className="mt-3">
                  <ShareLinks slug={draft.editing} />
                </div>
              </details>
            ) : null}
            <p className="text-center text-xs text-muted-foreground">
              Tu texto se guarda en este dispositivo mientras escribes.{" "}
              <button type="button" onClick={() => void logout()} className="underline">
                Cerrar sesión
              </button>
            </p>
          </div>
        </div>
      </form>

      <aside
        aria-label="Hoja de ruta y optimización"
        className="sticky top-6 hidden max-h-[calc(100dvh-3rem)] self-start overflow-y-auto border-l pl-6 lg:block"
      >
        {panel}
      </aside>

      {/* On phones the panel is a bottom sheet behind a bar that shows the score. */}
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="fixed inset-x-4 bottom-4 z-40 flex h-12 items-center justify-between rounded-full border bg-background/95 px-5 text-sm shadow-lg backdrop-blur lg:hidden"
            />
          }
        >
          <span className="font-medium">Hoja de ruta y optimización</span>
          <span className={score.blocking > 0 ? "text-destructive" : "text-muted-foreground"}>
            {score.passed}/{score.total}
          </span>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto px-4 pb-8">
          <SheetHeader className="px-0">
            <SheetTitle>Hoja de ruta y optimización</SheetTitle>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// One Notion-style property row: label on the left, inline field on the right.
function Property({
  label,
  htmlFor,
  top = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  top?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className={top ? "self-start pt-2" : undefined}>
        <Label htmlFor={htmlFor} className="text-xs font-normal text-muted-foreground">
          {label}
        </Label>
      </dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

// The post URL tagged per channel, so Vercel Web Analytics shows where readers came from.
function ShareLinks({ slug }: { slug: string }) {
  async function copy(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast(`Enlace para ${label} copiado.`);
    } catch {
      toast.error("No se pudo copiar. Selecciona el enlace y cópialo a mano.");
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Comparte con estos enlaces</p>
      <ul className="space-y-2">
        {shareChannels.map((channel) => {
          const url = shareUrl(slug, channel);
          return (
            <li key={url} className="flex items-center gap-2 rounded-lg border p-2 pl-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{channel.label}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{url}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Copiar enlace para ${channel.label}`}
                onClick={() => void copy(url, channel.label)}
              >
                <CopyIcon />
                Copiar
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type PostSummary = { slug: string; title: string; draft: boolean };

// Loads a stored post into the editor, or clears it for a new one.
function PostPicker({
  editing,
  posts,
  onPick,
}: {
  editing: string | null;
  posts: PostSummary[] | null;
  onPick: (draft: Draft) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function pick(slug: string | null) {
    if (slug === null) {
      onPick(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`);
      const data: { post?: PostFields } = await response.json();
      if (data.post) onPick(toDraft(data.post, slug));
    } finally {
      setLoading(false);
    }
  }

  const NEW = "__nuevo";
  return (
    <div className="min-w-0 flex-1 basis-56">
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
        <SelectTrigger aria-label="Post" className="h-9 w-full">
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

// Upload a .mdx file into the form, and download or delete the post being edited.
function PostFiles({
  editing,
  title,
  onImported,
  onDeleted,
  onLoggedOut,
}: {
  editing: string | null;
  title: string;
  onImported: (draft: Draft) => void;
  onDeleted: () => void;
  onLoggedOut: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "import", fileName: file.name, source: await file.text() }),
      });
      if (response.status === 401) {
        onLoggedOut();
        return;
      }
      const data: { post?: PostFields; editing?: string | null; error?: string } =
        await response.json();
      if (data.post) onImported(toDraft(data.post, data.editing ?? null));
      else toast.error(data.error ?? "No se pudo leer el archivo.");
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove() {
    if (!editing) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/posts?slug=${encodeURIComponent(editing)}`, {
        method: "DELETE",
      });
      if (response.status === 401) {
        onLoggedOut();
        return;
      }
      if (response.ok) {
        setConfirming(false);
        onDeleted();
      } else {
        toast.error("No se pudo eliminar. Recarga la página e intenta de nuevo.");
      }
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={fileInput}
        type="file"
        accept=".mdx,.md,text/markdown"
        className="hidden"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={importing}
        onClick={() => fileInput.current?.click()}
      >
        {importing ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
        Subir .mdx
      </Button>
      {editing ? (
        <>
          <a
            href={`/api/admin/posts?slug=${encodeURIComponent(editing)}&download=1`}
            download={`${editing}.mdx`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <DownloadIcon />
            Descargar
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2Icon />
            Eliminar
          </Button>
          <Dialog open={confirming} onOpenChange={setConfirming}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar este post?</DialogTitle>
                <DialogDescription>
                  «{title || editing}» deja de estar en /blog/{editing} de inmediato. Si quieres
                  conservarlo, descárgalo antes.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
                <Button type="button" variant="destructive" disabled={deleting} onClick={() => void remove()}>
                  {deleting ? <Loader2Icon className="animate-spin" /> : null}
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
