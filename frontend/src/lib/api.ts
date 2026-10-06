import { API_BASE } from "./config";
import type { ConnectionInfo } from "./types";

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const url = (path: string) => `${API_BASE}${path}`;

async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url(path), { cache: "no-store", ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new ApiError("network", "Could not reach the test server.");
  }
  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const body = (await res.json()) as { error?: { code?: string } };
      if (body.error?.code) code = body.error.code;
    } catch { /* ignore */ }
    throw new ApiError(code, `Server responded with ${res.status}.`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError("invalid_response", "The server sent an invalid response.");
  }
}

export const getInfo = () => request<ConnectionInfo>("/api/info");

export interface AnalysisMetrics {
  downloadMbps: number; uploadMbps: number; pingMs: number; jitterMs: number;
  requestLossPercent: number; isp?: string;
}
export const getAnalysis = (m: AnalysisMetrics) =>
  request<{ analysis: string; model: string }>(
    "/api/analyze",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) },
    20000,
  );

export function describeApiError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === "ai_rate_limited" || e.code === "rate_limited") return "The analysis limit was reached. Try again in a few minutes.";
    if (e.code === "ai_not_configured") return "AI analysis is not configured on this server.";
    if (e.code === "origin_not_allowed") return "This site is not on the API's allowed origins list.";
    if (e.code === "network") return "The API is unreachable.";
  }
  return "The analysis service is unavailable.";
}
