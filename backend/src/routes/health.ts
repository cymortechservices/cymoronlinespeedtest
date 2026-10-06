import type { Env } from "../types";
import { baseHeaders } from "../http";

/** Tiny response used for latency probes. HEAD and GET both work. */
export function health(request: Request, env: Env): Response {
  const h = baseHeaders(request, env);
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("X-Server-Time", String(Date.now()));
  const body = request.method === "HEAD" ? null : JSON.stringify({ ok: true });
  return new Response(body, { status: 200, headers: h });
}
