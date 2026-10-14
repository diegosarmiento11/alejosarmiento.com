import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { author, SITE_URL } from "./site";

const INK = "#1c1917";
const PAPER = "#fbfaf7";
const MUTED = "#78716c";
const BRAND = "#b4532a";

export const OG_SIZE = { width: 1200, height: 630 };
export const STORY_SIZE = { width: 1080, height: 1920 };

// The portrait is 800×1200. This square frames the face and is what every icon shows.
const PHOTO = { width: 800, height: 1200 };
const FACE = { x: 165, y: 100, side: 480 };

const HOST = new URL(SITE_URL).host;
const IDENTITY_LINE = author.identityLine.charAt(0).toUpperCase() + author.identityLine.slice(1);

// Read synchronously: these are build inputs, not request-time data, so the
// images can be prerendered.
function photoDataUrl(): string {
  const photo = readFileSync(path.join(process.cwd(), "public", author.photo), "base64");
  return `data:image/jpeg;base64,${photo}`;
}

function fonts() {
  const root = process.cwd();
  const serif = readFileSync(path.join(root, "src/assets/fonts/newsreader-latin-500-normal.woff"));
  const sans = readFileSync(path.join(root, "src/assets/fonts/inter-latin-500-normal.woff"));
  return [
    { name: "Newsreader", data: serif, weight: 500, style: "normal" },
    { name: "Inter", data: sans, weight: 500, style: "normal" },
  ] as const;
}

function titleSize(title: string, sizes: [number, number, number]): number {
  if (title.length <= 34) return sizes[0];
  if (title.length <= 50) return sizes[1];
  return sizes[2];
}

export type Card = {
  // Small uppercase line above the title: the pillar of a post, or the section.
  label: string;
  title: string;
};

// The 1200×630 card for link previews. The portrait fills the right third so the
// face stays recognizable at the size WhatsApp, LinkedIn and iMessage show it.
export function renderOgImage(card: Card): ImageResponse {
  const photoWidth = 420;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
          color: INK,
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 56px 56px 68px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: BRAND,
            }}
          >
            {card.label}
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Newsreader",
              fontSize: titleSize(card.title, [76, 64, 54]),
              lineHeight: 1.08,
              letterSpacing: -1.5,
            }}
          >
            {card.title}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32 }}>{author.name}</div>
            <div style={{ display: "flex", marginTop: 4, fontSize: 22, color: MUTED }}>
              {IDENTITY_LINE}
            </div>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered to PNG by satori */}
        <img
          src={photoDataUrl()}
          width={photoWidth}
          height={OG_SIZE.height}
          style={{ objectFit: "cover", objectPosition: "50% 0%" }}
        />
      </div>
    ),
    { ...OG_SIZE, fonts: [...fonts()] },
  );
}

// The 1080×1920 image a reader posts to Instagram Stories.
export function renderStoryImage(card: Card): ImageResponse {
  const avatar = 132;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "220px 96px 260px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 38,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: BRAND,
          }}
        >
          {card.label}
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontSize: titleSize(card.title, [124, 108, 94]),
            lineHeight: 1.08,
            letterSpacing: -1.5,
          }}
        >
          {card.title}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered to PNG by satori */}
            <img
              src={photoDataUrl()}
              width={avatar}
              height={avatar}
              style={{ borderRadius: avatar, objectFit: "cover", objectPosition: "50% 20%" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 46 }}>{author.name}</div>
              <div style={{ display: "flex", fontSize: 34, color: MUTED }}>forabi.ai</div>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 36, color: MUTED }}>Léelo en {HOST}</div>
        </div>
      </div>
    ),
    { ...STORY_SIZE, fonts: [...fonts()] },
  );
}

// The face, cropped square. Browser tabs and Google get it round; iOS masks the
// home-screen icon itself and paints transparent corners black, so that one is square.
export function renderIcon(size: number, shape: "round" | "square"): ImageResponse {
  const scale = size / FACE.side;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          borderRadius: shape === "round" ? size : 0,
          background: INK,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered to PNG by satori */}
        <img
          src={photoDataUrl()}
          width={PHOTO.width * scale}
          height={PHOTO.height * scale}
          style={{ position: "absolute", left: -FACE.x * scale, top: -FACE.y * scale }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
