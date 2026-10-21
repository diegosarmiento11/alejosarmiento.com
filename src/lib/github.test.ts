import { describe, expect, it, vi } from "vitest";
import { createRepoFile } from "./github";

const file = { path: "content/blog/mi-post.mdx", content: "hola ñ", message: "content: add mi-post" };
const repo = { token: "t", repo: "dueño/repo", branch: "main" };

function respond(status: number, body: unknown = {}) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
}

describe("createRepoFile", () => {
  it("sends the file base64-encoded to the branch, without overwriting", async () => {
    const fetcher = respond(201, { commit: { html_url: "https://github.com/c/1" } });
    const result = await createRepoFile(file, { ...repo, fetch: fetcher });

    expect(result).toEqual({ ok: true, commitUrl: "https://github.com/c/1" });
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/repos/dueño/repo/contents/content/blog/mi-post.mdx");
    const body = JSON.parse(String(init?.body));
    expect(Buffer.from(body.content, "base64").toString("utf8")).toBe("hola ñ");
    expect(body.branch).toBe("main");
    expect(body.sha).toBeUndefined();
  });

  it("reports an existing file as a conflict", async () => {
    const result = await createRepoFile(file, { ...repo, fetch: respond(422) });
    expect(result).toMatchObject({ ok: false, status: 409 });
  });

  it("blames the token when GitHub refuses access", async () => {
    const result = await createRepoFile(file, { ...repo, fetch: respond(403) });
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("GITHUB_TOKEN") });
  });
});
