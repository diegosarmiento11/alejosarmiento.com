// Wraps one PNG in an ICO container. Crawlers and older browsers request
// /favicon.ico no matter what the page declares, and ICO accepts PNG payloads.
export function pngToIco(png: Uint8Array, size: number): Uint8Array {
  if (size < 1 || size > 256) throw new RangeError("ICO entries are 1 to 256 px");
  const HEADER = 6;
  const ENTRY = 16;
  const ico = new Uint8Array(HEADER + ENTRY + png.length);
  const view = new DataView(ico.buffer);
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, 1, true); // image count
  ico[6] = size % 256; // width; 0 means 256
  ico[7] = size % 256; // height
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, png.length, true);
  view.setUint32(18, HEADER + ENTRY, true);
  ico.set(png, HEADER + ENTRY);
  return ico;
}
