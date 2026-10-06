import type { Env } from "../types";
import { LIMITS, baseHeaders, errorResponse } from "../http";

const CHUNK = 64 * 1024;

/**
 * GET /api/download?bytes=N
 * Streams N bytes of incompressible pseudo-random data (never stored).
 * One random 64 KiB block is generated per request and re-sent, which keeps
 * CPU cost near zero. Content-Encoding is "identity" so nothing is compressed.
 */
export function download(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("bytes"));
  if (!Number.isInteger(requested) || requested < 1 || requested > LIMITS.maxDownloadBytes) {
    return errorResponse(request, env, 400, "invalid_bytes", `bytes must be an integer from 1 to ${LIMITS.maxDownloadBytes}`);
  }

  const block = new Uint8Array(CHUNK);
  crypto.getRandomValues(block.subarray(0, 65536));

  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      const remaining = requested - sent;
      if (remaining <= 0) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK, remaining);
      controller.enqueue(size === CHUNK ? block : block.subarray(0, size));
      sent += size;
    },
  });

  const h = baseHeaders(request, env);
  h.set("Content-Type", "application/octet-stream");
  h.set("Content-Encoding", "identity");
  h.set("Content-Length", String(requested));
  return new Response(stream, { status: 200, headers: h });
}
