import type { Env } from "../types";
import { LIMITS, errorResponse, json } from "../http";

/**
 * POST /api/upload
 * Reads and discards the request body while counting bytes. Nothing is stored.
 * Stops as soon as the body exceeds the per-request limit.
 */
export async function upload(request: Request, env: Env): Promise<Response> {
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (declared > LIMITS.maxUploadBytes) {
    return errorResponse(request, env, 413, "payload_too_large", "Upload exceeds the per-request limit.");
  }
  if (!request.body) return json(request, env, { bytes: 0 });

  const reader = request.body.getReader();
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > LIMITS.maxUploadBytes) {
        await reader.cancel();
        return errorResponse(request, env, 413, "payload_too_large", "Upload exceeds the per-request limit.");
      }
    }
  } catch {
    return errorResponse(request, env, 400, "upload_interrupted", "Upload was interrupted.");
  }
  return json(request, env, { bytes: received }, 200, { "X-Bytes-Received": String(received) });
}
