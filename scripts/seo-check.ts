// Validates every post in the store against CLAUDE.md §4. Exits 1 on any issue.
// With Upstash credentials in .env.local it checks the real posts in Redis;
// without them, the example post development runs on.
import { hasRedis } from "../src/lib/env";
import { readPosts } from "../src/lib/posts";
import { checkAll } from "../src/lib/seo-check";
import { getStore } from "../src/lib/store";

async function main() {
  const { posts, errors } = await readPosts(getStore(), { includeDrafts: true });
  console.log(hasRedis ? "Posts en Redis:\n" : "Sin Redis: se revisa el post de ejemplo.\n");
  for (const error of errors) console.error(`✗ ${error}`);

  const issues = checkAll(posts);
  for (const post of posts) {
    const own = issues.filter((issue) => issue.slug === post.slug);
    const label = `${post.slug}${post.draft ? " (borrador)" : ""}`;
    if (own.length === 0) {
      console.log(`✓ ${label}`);
    } else {
      console.log(`✗ ${label}`);
      for (const issue of own) console.log(`    - ${issue.message}`);
    }
  }

  const total = issues.length + errors.length;
  if (total > 0) {
    console.error(`\nseo:check falló: ${total} problema(s) en ${posts.length + errors.length} post(s).`);
    process.exit(1);
  }
  console.log(`\nseo:check ok: ${posts.length} post(s).`);
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
