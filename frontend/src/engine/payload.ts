/** Incompressible upload body made of random bytes (crypto.getRandomValues max is 65,536 bytes per call). */
export function makeRandomBlob(bytes: number): Blob {
  const buf = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i += 65536) crypto.getRandomValues(buf.subarray(i, Math.min(i + 65536, bytes)));
  return new Blob([buf], { type: "application/octet-stream" });
}
