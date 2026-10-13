import { randomUUID } from "node:crypto";
import type { Store } from "./store";

export const REACTIONS = ["like", "love", "dislike"] as const;
export type Reaction = (typeof REACTIONS)[number];
export type ReactionCounts = Record<Reaction, number>;

export function isReaction(value: unknown): value is Reaction {
  return typeof value === "string" && REACTIONS.includes(value as Reaction);
}

const keys = {
  siteVisits: "visits:site",
  postViews: "views:posts",
  reactionCounts: (slug: string) => `reactions:${slug}`,
  reactors: (slug: string) => `reactors:${slug}`,
  comments: (slug: string) => `comments:${slug}`,
  rateLimit: (bucket: string, id: string, window: number) =>
    `rl:${bucket}:${id}:${window}`,
};

// --- Visits and views -------------------------------------------------------

export async function recordSiteVisit(store: Store): Promise<number> {
  return store.incr(keys.siteVisits);
}

export async function getSiteVisits(store: Store): Promise<number> {
  return Number((await store.get(keys.siteVisits)) ?? 0);
}

export async function recordPostView(store: Store, slug: string): Promise<number> {
  return store.hincrby(keys.postViews, slug, 1);
}

export async function getPostViews(store: Store, slug: string): Promise<number> {
  return Number((await store.hget(keys.postViews, slug)) ?? 0);
}

// --- Reactions --------------------------------------------------------------

export async function getReactions(
  store: Store,
  slug: string,
  visitorId?: string,
): Promise<{ counts: ReactionCounts; mine: Reaction | null }> {
  const [raw, mine] = await Promise.all([
    store.hgetall(keys.reactionCounts(slug)),
    visitorId ? store.hget(keys.reactors(slug), visitorId) : null,
  ]);
  const counts = Object.fromEntries(
    REACTIONS.map((reaction) => [reaction, Math.max(0, Number(raw[reaction] ?? 0))]),
  ) as ReactionCounts;
  return { counts, mine: isReaction(mine) ? mine : null };
}

// One reaction per visitor and post. Passing the current one, or null, clears it.
export async function setReaction(
  store: Store,
  slug: string,
  visitorId: string,
  next: Reaction | null,
): Promise<{ counts: ReactionCounts; mine: Reaction | null }> {
  const stored = await store.hget(keys.reactors(slug), visitorId);
  const previous = isReaction(stored) ? stored : null;
  const target = next === previous ? null : next;

  if (previous) await store.hincrby(keys.reactionCounts(slug), previous, -1);
  if (target) {
    await store.hincrby(keys.reactionCounts(slug), target, 1);
    await store.hset(keys.reactors(slug), visitorId, target);
  } else if (previous) {
    await store.hdel(keys.reactors(slug), visitorId);
  }
  return getReactions(store, slug, visitorId);
}

// --- Comments ---------------------------------------------------------------

export const COMMENT_NAME_MAX = 60;
export const COMMENT_BODY_MAX = 1500;

export type Comment = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  status: "pending" | "approved";
};

export type PublicComment = Pick<Comment, "id" | "name" | "body" | "createdAt">;

export function cleanCommentInput(input: {
  name: unknown;
  body: unknown;
}): { name: string; body: string } | { error: string } {
  if (typeof input.name !== "string" || typeof input.body !== "string") {
    return { error: "Faltan el nombre o el comentario." };
  }
  const name = input.name.replace(/\s+/g, " ").trim();
  const body = input.body.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (name.length < 2 || name.length > COMMENT_NAME_MAX) {
    return { error: `El nombre debe tener entre 2 y ${COMMENT_NAME_MAX} caracteres.` };
  }
  if (body.length < 3 || body.length > COMMENT_BODY_MAX) {
    return { error: `El comentario debe tener entre 3 y ${COMMENT_BODY_MAX} caracteres.` };
  }
  return { name, body };
}

export async function addComment(
  store: Store,
  slug: string,
  input: { name: string; body: string },
  options: { autoApprove: boolean; now: Date },
): Promise<Comment> {
  const comment: Comment = {
    id: randomUUID(),
    name: input.name,
    body: input.body,
    createdAt: options.now.toISOString(),
    status: options.autoApprove ? "approved" : "pending",
  };
  await store.hset(keys.comments(slug), comment.id, JSON.stringify(comment));
  return comment;
}

function parseComment(raw: string | null): Comment | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Comment;
  } catch {
    return null;
  }
}

export async function listApprovedComments(
  store: Store,
  slug: string,
): Promise<PublicComment[]> {
  const all = await store.hgetall(keys.comments(slug));
  return Object.values(all)
    .map(parseComment)
    .filter((comment): comment is Comment => comment?.status === "approved")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(({ id, name, body, createdAt }) => ({ id, name, body, createdAt }));
}

export async function moderateComment(
  store: Store,
  slug: string,
  id: string,
  action: "approve" | "delete",
): Promise<"approved" | "deleted" | "not-found"> {
  const comment = parseComment(await store.hget(keys.comments(slug), id));
  if (!comment) return "not-found";
  if (action === "delete") {
    await store.hdel(keys.comments(slug), id);
    return "deleted";
  }
  await store.hset(
    keys.comments(slug),
    id,
    JSON.stringify({ ...comment, status: "approved" }),
  );
  return "approved";
}

// --- Rate limiting ----------------------------------------------------------

// Fixed window. Returns true while `id` is within `limit` for the current window.
export async function allowRequest(
  store: Store,
  bucket: string,
  id: string,
  { limit, windowSeconds, now }: { limit: number; windowSeconds: number; now: Date },
): Promise<boolean> {
  const window = Math.floor(now.getTime() / 1000 / windowSeconds);
  const key = keys.rateLimit(bucket, id, window);
  const count = await store.incr(key);
  if (count === 1) await store.expire(key, windowSeconds * 2);
  return count <= limit;
}
