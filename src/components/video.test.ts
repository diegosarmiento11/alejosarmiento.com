import { describe, expect, it } from "vitest";
import { toEmbed } from "./video";

describe("toEmbed", () => {
  it("embeds Instagram reels and posts as vertical", () => {
    expect(toEmbed("https://www.instagram.com/reel/Cabc_123/?igsh=x")).toEqual({
      src: "https://www.instagram.com/reel/Cabc_123/embed",
      vertical: true,
    });
    expect(toEmbed("https://instagram.com/p/XYZ/")?.src).toBe("https://www.instagram.com/p/XYZ/embed");
  });

  it("embeds TikTok videos by id", () => {
    expect(toEmbed("https://www.tiktok.com/@alejo/video/7300000000000000000")?.src).toBe(
      "https://www.tiktok.com/embed/v2/7300000000000000000",
    );
  });

  it("embeds YouTube watch, short links and shorts", () => {
    expect(toEmbed("https://www.youtube.com/watch?v=abc123")).toEqual({
      src: "https://www.youtube-nocookie.com/embed/abc123",
      vertical: false,
    });
    expect(toEmbed("https://youtu.be/abc123")?.src).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(toEmbed("https://www.youtube.com/shorts/abc123")?.vertical).toBe(true);
  });

  it("returns null for anything it does not know", () => {
    expect(toEmbed("https://example.com/video/1")).toBeNull();
    expect(toEmbed("https://www.instagram.com/alejosarmiento.ai/")).toBeNull();
    expect(toEmbed("not a url")).toBeNull();
  });
});
