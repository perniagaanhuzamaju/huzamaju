/**
 * Removes personal identifiers from free text before it is sent to the AI
 * provider: e-mail addresses, Malaysian IC numbers and phone numbers.
 */
export function scrubPersonalData(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mel]")
    .replace(/\b\d{6}-?\d{2}-?\d{4}\b/g, "[no. IC]")
    .replace(/(?:\+?6?0)[\s-]?1\d(?:[\s-]?\d){7,8}\b/g, "[no. telefon]")
    .replace(/(?:\+?6?0)[\s-]?[3-9](?:[\s-]?\d){7,8}\b/g, "[no. telefon]");
}

/** Strips APP1 (EXIF/XMP, which can hold GPS coordinates) segments from a JPEG. Returns the input if it is not a well-formed JPEG. */
export function stripJpegMetadata(buf: Buffer): Buffer {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  const out: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) return buf;
    const marker = buf[i + 1];
    if (marker === 0xda) {
      out.push(buf.subarray(i)); // start of scan: copy the rest verbatim
      return Buffer.concat(out);
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) return buf;
    if (marker !== 0xe1) out.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  return buf;
}
