import { describe, expect, it } from "vitest";
import { pngToIco } from "./ico";

describe("pngToIco", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

  it("declares a single 32-bit icon and points at the PNG payload", () => {
    const ico = pngToIco(png, 48);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(1);
    expect([ico[6], ico[7]]).toEqual([48, 48]);
    expect(view.getUint16(12, true)).toBe(32);
    expect(view.getUint32(14, true)).toBe(png.length);
    const offset = view.getUint32(18, true);
    expect(Array.from(ico.slice(offset))).toEqual(Array.from(png));
    expect(ico.length).toBe(offset + png.length);
  });

  it("encodes 256 px as 0, as the format requires", () => {
    const ico = pngToIco(png, 256);
    expect([ico[6], ico[7]]).toEqual([0, 0]);
  });

  it("rejects sizes the format cannot hold", () => {
    expect(() => pngToIco(png, 512)).toThrow(RangeError);
  });
});
