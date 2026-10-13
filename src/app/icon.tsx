import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// "AS" monogram in the blog's serif.
export default function Icon() {
  const serif = readFileSync(
    path.join(process.cwd(), "src/assets/fonts/newsreader-latin-500-normal.woff"),
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c1917",
          color: "#fbfaf7",
          borderRadius: 14,
          fontFamily: "Newsreader",
          fontSize: 36,
          letterSpacing: -1,
        }}
      >
        AS
      </div>
    ),
    { ...size, fonts: [{ name: "Newsreader", data: serif, weight: 500, style: "normal" }] },
  );
}
