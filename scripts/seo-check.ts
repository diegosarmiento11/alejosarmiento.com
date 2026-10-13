// Validates every post against CLAUDE.md §4. Exits 1 on any issue.
import { loadPosts } from "../src/lib/posts";
import { checkAll } from "../src/lib/seo-check";

let posts;
try {
  posts = loadPosts({ includeDrafts: true });
} catch (error) {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

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

if (issues.length > 0) {
  console.error(`\nseo:check falló: ${issues.length} problema(s) en ${posts.length} post(s).`);
  process.exit(1);
}
console.log(`\nseo:check ok: ${posts.length} post(s).`);
