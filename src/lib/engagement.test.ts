import { beforeEach, describe, expect, it } from "vitest";
import {
  addComment,
  allowRequest,
  cleanCommentInput,
  COMMENT_BODY_MAX,
  getPostViews,
  getReactions,
  getSiteVisits,
  listApprovedComments,
  moderateComment,
  recordPostView,
  recordSiteVisit,
  setReaction,
} from "./engagement";
import { MemoryStore } from "./store";

let store: MemoryStore;
beforeEach(() => {
  store = new MemoryStore();
});

describe("visits and views", () => {
  it("counts site visits and per-post views independently", async () => {
    await recordSiteVisit(store);
    await recordSiteVisit(store);
    await recordPostView(store, "a");
    expect(await getSiteVisits(store)).toBe(2);
    expect(await getPostViews(store, "a")).toBe(1);
    expect(await getPostViews(store, "b")).toBe(0);
  });
});

describe("reactions", () => {
  it("records one reaction per visitor", async () => {
    await setReaction(store, "post", "v1", "like");
    const result = await setReaction(store, "post", "v2", "love");
    expect(result.counts).toEqual({ like: 1, love: 1, dislike: 0 });
    expect(result.mine).toBe("love");
  });

  it("moves the count when a visitor changes their reaction", async () => {
    await setReaction(store, "post", "v1", "like");
    const result = await setReaction(store, "post", "v1", "dislike");
    expect(result.counts).toEqual({ like: 0, love: 0, dislike: 1 });
    expect(result.mine).toBe("dislike");
  });

  it("clears the reaction when the same one is sent again", async () => {
    await setReaction(store, "post", "v1", "love");
    const result = await setReaction(store, "post", "v1", "love");
    expect(result.counts.love).toBe(0);
    expect(result.mine).toBeNull();
  });

  it("clears the reaction when null is sent, and ignores null with nothing set", async () => {
    await setReaction(store, "post", "v1", "like");
    expect((await setReaction(store, "post", "v1", null)).counts.like).toBe(0);
    expect((await setReaction(store, "post", "v1", null)).counts.like).toBe(0);
  });

  it("keeps posts and visitors isolated", async () => {
    await setReaction(store, "one", "v1", "like");
    const other = await getReactions(store, "two", "v1");
    expect(other.counts.like).toBe(0);
    expect(other.mine).toBeNull();
    expect((await getReactions(store, "one", "v2")).mine).toBeNull();
  });
});

describe("comments", () => {
  const now = new Date("2026-10-10T12:00:00Z");

  it("hides pending comments until they are approved", async () => {
    const comment = await addComment(
      store,
      "post",
      { name: "Ana", body: "Buen post" },
      { autoApprove: false, now },
    );
    expect(await listApprovedComments(store, "post")).toEqual([]);

    expect(await moderateComment(store, "post", comment.id, "approve")).toBe("approved");
    expect(await listApprovedComments(store, "post")).toEqual([
      { id: comment.id, name: "Ana", body: "Buen post", createdAt: now.toISOString() },
    ]);
  });

  it("deletes a comment and reports unknown ids", async () => {
    const comment = await addComment(
      store,
      "post",
      { name: "Ana", body: "Buen post" },
      { autoApprove: true, now },
    );
    expect(await moderateComment(store, "post", comment.id, "delete")).toBe("deleted");
    expect(await listApprovedComments(store, "post")).toEqual([]);
    expect(await moderateComment(store, "post", comment.id, "approve")).toBe("not-found");
  });

  it("lists approved comments oldest first", async () => {
    await addComment(store, "post", { name: "B", body: "segundo" }, {
      autoApprove: true,
      now: new Date("2026-10-11T00:00:00Z"),
    });
    await addComment(store, "post", { name: "A", body: "primero" }, { autoApprove: true, now });
    const list = await listApprovedComments(store, "post");
    expect(list.map((comment) => comment.body)).toEqual(["primero", "segundo"]);
  });

  it("trims input and rejects what is missing, too short or too long", () => {
    expect(cleanCommentInput({ name: "  Ana   María ", body: " Hola\r\n\n\n\nmundo " })).toEqual({
      name: "Ana María",
      body: "Hola\n\nmundo",
    });
    expect(cleanCommentInput({ name: "A", body: "Hola" })).toHaveProperty("error");
    expect(cleanCommentInput({ name: "Ana", body: "" })).toHaveProperty("error");
    expect(cleanCommentInput({ name: "Ana", body: "x".repeat(COMMENT_BODY_MAX + 1) })).toHaveProperty(
      "error",
    );
    expect(cleanCommentInput({ name: 1, body: null })).toHaveProperty("error");
  });
});

describe("rate limit", () => {
  const options = { limit: 2, windowSeconds: 60 };

  it("allows up to the limit within a window, per id and bucket", async () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(await allowRequest(store, "x", "ip1", { ...options, now })).toBe(true);
    expect(await allowRequest(store, "x", "ip1", { ...options, now })).toBe(true);
    expect(await allowRequest(store, "x", "ip1", { ...options, now })).toBe(false);
    expect(await allowRequest(store, "x", "ip2", { ...options, now })).toBe(true);
    expect(await allowRequest(store, "y", "ip1", { ...options, now })).toBe(true);
  });

  it("resets in the next window", async () => {
    const now = new Date("2026-10-10T12:00:00Z");
    for (let i = 0; i < 3; i++) await allowRequest(store, "x", "ip1", { ...options, now });
    const later = new Date(now.getTime() + 60_000);
    expect(await allowRequest(store, "x", "ip1", { ...options, now: later })).toBe(true);
  });
});
