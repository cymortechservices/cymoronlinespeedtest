import type { Env, Metrics } from "../types";
import { LIMITS, errorResponse, json, resolveOrigin } from "../http";
import { allow, clientKey } from "../ratelimit";
import { GeminiError, analyze as runGemini } from "../gemini";

function num(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * 100) / 100 : null;
}

/** Strict validation: unknown fields are dropped and ranges are enforced. */
function parse(body: unknown): Metrics | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const downloadMbps = num(b.downloadMbps, 0, 100000);
  const uploadMbps = num(b.uploadMbps, 0, 100000);
  const pingMs = num(b.pingMs, 0, 60000);
  const jitterMs = num(b.jitterMs, 0, 60000);
  const requestLossPercent = num(b.requestLossPercent, 0, 100);
  if (downloadMbps === null || uploadMbps === null || pingMs === null || jitterMs === null || requestLossPercent === null) return null;
  const isp = typeof b.isp === "string" ? b.isp.replace(/[^\p{L}\p{N} .,&'()-]/gu, "").slice(0, 80) : undefined;
  return { downloadMbps, uploadMbps, pingMs, jitterMs, requestLossPercent, ...(isp ? { isp } : {}) };
}

export async function analyzeRoute(request: Request, env: Env): Promise<Response> {
  // Not an open proxy: requests must come from an allowed browser origin.
  if (!resolveOrigin(request, env)) return errorResponse(request, env, 403, "origin_not_allowed", "Origin not allowed.");
  if (!allow(clientKey(request, "ai"), 6, 10 * 60 * 1000)) {
    return errorResponse(request, env, 429, "rate_limited", "Too many analysis requests. Try again later.");
  }
  const text = await request.text();
  if (text.length > LIMITS.maxAnalyzeBodyBytes) return errorResponse(request, env, 413, "payload_too_large", "Request too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return errorResponse(request, env, 400, "invalid_json", "Body must be JSON.");
  }
  const metrics = parse(body);
  if (!metrics) return errorResponse(request, env, 400, "invalid_metrics", "Metrics are missing or out of range.");

  try {
    const { text: analysis, model } = await runGemini(env, metrics);
    return json(request, env, { analysis, model });
  } catch (e) {
    if (e instanceof GeminiError) return errorResponse(request, env, e.status, e.code, "AI analysis is unavailable.");
    return errorResponse(request, env, 502, "ai_failed", "AI analysis is unavailable.");
  }
}
