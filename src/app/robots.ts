import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Search and AI crawlers are welcome: being cited by LLMs is a goal of this blog.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/moderar", "/newsletter/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
