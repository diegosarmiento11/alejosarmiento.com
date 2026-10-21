import fs from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-request";
import { cleanPostInput, reviewPost, todayInBogota } from "@/lib/compose-post";
import { env, hasGithub } from "@/lib/env";
import { createRepoFile } from "@/lib/github";
import { loadPosts } from "@/lib/posts";
import { readJson } from "@/lib/request";

// "check" reviews the post; "publish" reviews it again and, if it passes,
// commits content/blog/<slug>.mdx. Without a GitHub token, development writes
// the file locally and production refuses.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Inicia sesión de nuevo." }, { status: 401 });
  }
  const body = await readJson(request);
  const input = cleanPostInput(body.post);
  const review = reviewPost(input, loadPosts({ includeDrafts: true }), todayInBogota(new Date()));

  if (body.action !== "publish" || review.issues.length > 0) {
    return NextResponse.json({ slug: input.slug, issues: review.issues });
  }

  const filePath = `content/blog/${input.slug}.mdx`;

  if (hasGithub && env.githubToken) {
    const result = await createRepoFile(
      {
        path: filePath,
        content: review.mdx,
        message: `content: ${input.draft ? "draft" : "publish"} ${input.slug}\n\nWritten in /escribir.`,
      },
      { token: env.githubToken, repo: env.githubRepo, branch: env.githubBranch },
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ slug: input.slug, issues: [], published: true, commitUrl: result.commitUrl });
  }

  if (env.isProduction) {
    return NextResponse.json(
      { error: "Falta GITHUB_TOKEN: no se puede publicar desde aquí." },
      { status: 503 },
    );
  }
  try {
    await fs.writeFile(path.join(process.cwd(), "content", "blog", `${input.slug}.mdx`), review.mdx, {
      flag: "wx",
    });
  } catch {
    return NextResponse.json({ error: "Ya existe un archivo con ese slug." }, { status: 409 });
  }
  return NextResponse.json({ slug: input.slug, issues: [], published: true, commitUrl: null });
}
