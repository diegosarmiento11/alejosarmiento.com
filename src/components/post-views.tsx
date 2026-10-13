"use client";

import { useEffect, useState } from "react";

const numberFormat = new Intl.NumberFormat("es-CO");

// Counts one read per browser session and post, then shows the total.
export function PostViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const key = `viewed:${slug}`;
    let counted = false;
    try {
      counted = sessionStorage.getItem(key) === "1";
      sessionStorage.setItem(key, "1");
    } catch {
      counted = true;
    }
    const request = counted
      ? fetch(`/api/views?slug=${encodeURIComponent(slug)}`)
      : fetch("/api/views", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug }),
        });
    request
      .then((response) => response.json())
      .then((data: { views?: number }) => {
        if (typeof data.views === "number") setViews(data.views);
      })
      .catch(() => {});
  }, [slug]);

  if (views === null) return null;
  return (
    <>
      <span aria-hidden="true">·</span>
      <span>
        {numberFormat.format(views)} {views === 1 ? "lectura" : "lecturas"}
      </span>
    </>
  );
}
