import { pngToIco } from "@/lib/ico";
import { renderIcon } from "@/lib/og";

const SIDE = 48;

// Same face as /icon, for the clients that only ever ask for /favicon.ico.
export async function GET() {
  const png = new Uint8Array(await renderIcon(SIDE, "round").arrayBuffer());
  return new Response(pngToIco(png, SIDE) as BodyInit, {
    headers: { "Content-Type": "image/x-icon" },
  });
}
