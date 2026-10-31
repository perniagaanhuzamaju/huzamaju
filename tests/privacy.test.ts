import { describe, expect, it } from "vitest";
import { scrubPersonalData, stripJpegMetadata } from "@/lib/ai/privacy";
import { sniffType } from "@/lib/storage";

describe("scrubPersonalData", () => {
  it("removes phone numbers, emails and IC numbers", () => {
    const s = scrubPersonalData("Call 017-871 7848 or +60 12 345 6789, ali@example.com, IC 900101-01-1234. Bilik 12x10 kaki, 3 titik lampu.");
    expect(s).not.toMatch(/871|345|example|900101/);
    expect(s).toContain("12x10 kaki");
    expect(s).toContain("3 titik");
  });
  it("keeps measurements with many digits", () => {
    expect(scrubPersonalData("Luas 1200 kps, panjang 150 m")).toBe("Luas 1200 kps, panjang 150 m");
  });
});

describe("stripJpegMetadata", () => {
  it("drops APP1 segments and keeps the rest", () => {
    const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x04, 0x01, 0x02]);
    const app1 = Buffer.from([0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66]);
    const sos = Buffer.from([0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]);
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8]), app0, app1, sos]);
    const out = stripJpegMetadata(jpg);
    expect(out.equals(Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sos]))).toBe(true);
  });
  it("returns non-JPEG input unchanged", () => {
    const b = Buffer.from("%PDF-1.4");
    expect(stripJpegMetadata(b)).toBe(b);
  });
});

describe("sniffType", () => {
  it("detects by magic bytes, not extension", () => {
    expect(sniffType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffType(Buffer.from("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffType(Buffer.from("<script>"))).toBeNull();
  });
});
