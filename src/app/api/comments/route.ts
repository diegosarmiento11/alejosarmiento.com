import { type NextRequest, NextResponse } from "next/server";
import { commentNotificationEmail, sendEmail } from "@/lib/email";
import {
  addComment,
  allowRequest,
  cleanCommentInput,
  listApprovedComments,
} from "@/lib/engagement";
import { env } from "@/lib/env";
import { commentsAutoApprove, commentsEnabled } from "@/lib/features";
import { getPost } from "@/lib/posts";
import { clientIp, readJson } from "@/lib/request";
import { absoluteUrl } from "@/lib/site";
import { getStore } from "@/lib/store";
import { createToken } from "@/lib/tokens";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!getPost(slug)) {
    return NextResponse.json({ error: "Post no encontrado." }, { status: 404 });
  }
  if (!commentsEnabled) return NextResponse.json({ enabled: false, comments: [] });
  return NextResponse.json({
    enabled: true,
    comments: await listApprovedComments(getStore(), slug),
  });
}

export async function POST(request: NextRequest) {
  if (!commentsEnabled) {
    return NextResponse.json({ error: "Los comentarios están cerrados." }, { status: 503 });
  }
  const body = await readJson(request);
  const post = typeof body.slug === "string" ? getPost(body.slug) : undefined;
  if (!post) {
    return NextResponse.json({ error: "Post no encontrado." }, { status: 404 });
  }
  // Honeypot: real readers never see or fill this field. Answer as if it worked.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ status: "pending" });
  }

  const input = cleanCommentInput({ name: body.name, body: body.body });
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const store = getStore();
  const now = new Date();
  const allowed = await allowRequest(store, "comments", clientIp(request), {
    limit: 5,
    windowSeconds: 3600,
    now,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Ya enviaste varios comentarios. Intenta más tarde." },
      { status: 429 },
    );
  }

  const comment = await addComment(store, post.slug, input, {
    autoApprove: commentsAutoApprove,
    now,
  });

  if (comment.status === "pending" && env.signingSecret && env.ownerEmail) {
    const token = createToken(
      { slug: post.slug, id: comment.id },
      { secret: env.signingSecret, expiresInSeconds: THIRTY_DAYS, now },
    );
    await sendEmail({
      to: env.ownerEmail,
      ...commentNotificationEmail({
        postTitle: post.title,
        name: comment.name,
        body: comment.body,
        moderateUrl: absoluteUrl(`/moderar?token=${encodeURIComponent(token)}`),
      }),
    });
  }

  return NextResponse.json({
    status: comment.status,
    comment:
      comment.status === "approved"
        ? { id: comment.id, name: comment.name, body: comment.body, createdAt: comment.createdAt }
        : undefined,
  });
}
