// Creates a file in the repo through the GitHub contents API. Pushing to the
// production branch is what publishes: Vercel builds and deploys the commit.

export type PublishResult =
  | { ok: true; commitUrl: string }
  | { ok: false; status: number; error: string };

export async function createRepoFile(
  { path, content, message }: { path: string; content: string; message: string },
  {
    token,
    repo,
    branch,
    fetch: fetcher = fetch,
  }: { token: string; repo: string; branch: string; fetch?: typeof fetch },
): Promise<PublishResult> {
  const response = await fetcher(
    `https://api.github.com/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "PUT",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
      },
      // Without a sha, GitHub refuses to overwrite a file that already exists.
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch,
      }),
    },
  );

  if (response.ok) {
    const data = (await response.json()) as { commit?: { html_url?: string } };
    return { ok: true, commitUrl: data.commit?.html_url ?? "" };
  }
  if (response.status === 422) {
    return { ok: false, status: 409, error: "Ya existe un post con ese slug en GitHub." };
  }
  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return {
      ok: false,
      status: 502,
      error: "GitHub rechazó el token. Revisa GITHUB_TOKEN y sus permisos sobre el repo.",
    };
  }
  return { ok: false, status: 502, error: `GitHub respondió ${response.status}. Intenta de nuevo.` };
}
