import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { author, pillars, type PillarSlug } from "./site";

const INK = "#1c1917";
const PAPER = "#fbfaf7";
const MUTED = "#78716c";
const BRAND = "#b4532a";

// Read synchronously: these are build inputs, not request-time data, so the
// images can be prerendered.
function assets() {
  const root = process.cwd();
  const serif = readFileSync(path.join(root, "src/assets/fonts/newsreader-latin-500-normal.woff"));
  const sans = readFileSync(path.join(root, "src/assets/fonts/inter-latin-500-normal.woff"));
  const photo = readFileSync(path.join(root, "public/brand/alejandro.jpg"), "base64");
  return { serif, sans, photo: `data:image/jpeg;base64,${photo}` };
}

function titleSize(title: string, sizes: [number, number, number]): number {
  if (title.length <= 34) return sizes[0];
  if (title.length <= 50) return sizes[1];
  return sizes[2];
}

// One renderer for both shapes so the OG card and the Instagram story stay in sync.
export function renderPostImage(
  post: { title: string; pilar: PillarSlug },
  shape: "og" | "story",
): ImageResponse {
  const { serif, sans, photo } = assets();
  const story = shape === "story";
  const size = story ? { width: 1080, height: 1920 } : { width: 1200, height: 630 };
  const avatar = story ? 132 : 92;

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
          padding: story ? "220px 96px 260px" : "64px 72px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: story ? 38 : 26,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: BRAND,
          }}
        >
          {pillars[post.pilar].name}
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: "Newsreader",
            fontSize: story ? titleSize(post.title, [124, 108, 94]) : titleSize(post.title, [84, 72, 62]),
            lineHeight: 1.08,
            letterSpacing: -1.5,
          }}
        >
          {post.title}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: story ? 56 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: story ? 32 : 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered to PNG by satori */}
            <img
              src={photo}
              width={avatar}
              height={avatar}
              style={{ borderRadius: avatar, objectFit: "cover", objectPosition: "50% 20%" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: story ? 46 : 34 }}>{author.name}</div>
              <div style={{ display: "flex", fontSize: story ? 34 : 24, color: MUTED }}>
                forabi.ai
              </div>
            </div>
          </div>
          {story ? (
            <div style={{ display: "flex", fontSize: 36, color: MUTED }}>
              Léelo en alejosarmiento.com
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: serif, weight: 500, style: "normal" },
        { name: "Inter", data: sans, weight: 500, style: "normal" },
      ],
    },
  );
}
