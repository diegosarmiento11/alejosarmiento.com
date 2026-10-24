import { describe, expect, it } from "vitest";
import { shareUrl, shouldTrack } from "./analytics";

describe("shouldTrack", () => {
  it("tracks reader pages", () => {
    expect(shouldTrack("https://alejosarmiento.com/blog/mi-post?utm_source=instagram", false)).toBe(
      true,
    );
    expect(shouldTrack("https://alejosarmiento.com/", false)).toBe(true);
    expect(shouldTrack("https://alejosarmiento.com/escribiendo-mejor", false)).toBe(true);
  });

  it("skips the editor", () => {
    expect(shouldTrack("https://alejosarmiento.com/escribir", false)).toBe(false);
    expect(shouldTrack("https://alejosarmiento.com/escribir?x=1", false)).toBe(false);
  });

  it("skips everything on a device that opted out", () => {
    expect(shouldTrack("https://alejosarmiento.com/blog/mi-post", true)).toBe(false);
  });
});

describe("shareUrl", () => {
  it("tags the post URL with the channel", () => {
    expect(shareUrl("mi-post", { source: "instagram", medium: "historia" })).toBe(
      "https://alejosarmiento.com/blog/mi-post?utm_source=instagram&utm_medium=historia",
    );
  });
});
