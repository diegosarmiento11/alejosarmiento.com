import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// What Android and desktop browsers show when a reader saves the blog.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    lang: site.lang,
    start_url: "/",
    display: "browser",
    background_color: "#fbfaf7",
    theme_color: "#fbfaf7",
    icons: [192, 512].map((side) => ({
      src: `/icon/${side}`,
      sizes: `${side}x${side}`,
      type: "image/png",
    })),
  };
}
