import type { Env } from "./types";

export const LIMITS = {
  maxDownloadBytes: 50 * 1024 * 1024, // per request
  maxUploadBytes: 25 * 1024 * 1024, // per request
  maxAnalyzeBodyBytes: 2 * 1024,
};

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** Returns the origin to echo in CORS headers, or null when not allowed. */
export function resolveOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return allowedOrigins(env).includes(origin) ? origin : null;
}

export function baseHeaders(request: Request, env: Env): Headers {
  const h = new Headers();
  const origin = resolveOrigin(request, env);
  if (origin) {
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Vary", "Origin");
    h.set("Access-Control-Expose-Headers", "X-Server-Time, X-Bytes-Received");
  }
  h.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  h.set("Pragma", "no-cache");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "no-referrer");
  h.set("Cross-Origin-Resource-Policy", "cross-origin");
  h.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return h;
}

export function json(request: Request, env: Env, body: unknown, status = 200, extra?: Record<string, string>): Response {
  const h = baseHeaders(request, env);
  h.set("Content-Type", "application/json; charset=utf-8");
  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(JSON.stringify(body), { status, headers: h });
}

/** Never leak internals: only a short code + generic message is returned. */
export function errorResponse(request: Request, env: Env, status: number, code: string, message: string): Response {
  return json(request, env, { error: { code, message } }, status);
}

export function preflight(request: Request, env: Env): Response {
  const h = baseHeaders(request, env);
  h.set("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type");
  h.set("Access-Control-Max-Age", "600");
  return new Response(null, { status: 204, headers: h });
}
