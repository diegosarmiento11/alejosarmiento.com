"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "visit-counted";
const numberFormat = new Intl.NumberFormat("es-CO");

// Counts one visit per browser session and shows the site total.
export function SiteVisits() {
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    let counted = false;
    try {
      counted = sessionStorage.getItem(SESSION_KEY) === "1";
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Storage blocked: fall back to reading without counting.
      counted = true;
    }
    fetch("/api/visits", { method: counted ? "GET" : "POST" })
      .then((response) => response.json())
      .then((data: { visits?: number }) => {
        if (typeof data.visits === "number") setVisits(data.visits);
      })
      .catch(() => {});
  }, []);

  if (visits === null) return <span aria-hidden="true" />;
  return (
    <span>
      {numberFormat.format(visits)} {visits === 1 ? "visita" : "visitas"}
    </span>
  );
}
