import type { Env } from "./types";
import { errorResponse, preflight } from "./http";
import { allow, clientKey } from "./ratelimit";
import { health } from "./routes/health";
import { download } from "./routes/download";
import { upload } from "./routes/upload";
import { info } from "./routes/info";
import { analyzeRoute } from "./routes/analyze";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") return preflight(request, env);

    try {
      switch (pathname) {
        case "/":
          return new Response("CYMOR Internet Speed Test API", { headers: { "Content-Type": "text/plain" } });
        case "/api/health":
          if (method === "GET" || method === "HEAD") return health(request, env);
          break;
        case "/api/info":
          if (method === "GET") return info(request, env);
          break;
        case "/api/download":
          if (method === "GET") {
            if (!allow(clientKey(request, "dl"), 240, 60_000)) return errorResponse(request, env, 429, "rate_limited", "Too many requests.");
            return download(request, env);
          }
          break;
        case "/api/upload":
          if (method === "POST") {
            if (!allow(clientKey(request, "ul"), 240, 60_000)) return errorResponse(request, env, 429, "rate_limited", "Too many requests.");
            return await upload(request, env);
          }
          break;
        case "/api/analyze":
          if (method === "POST") return await analyzeRoute(request, env);
          break;
        default:
          return errorResponse(request, env, 404, "not_found", "Not found.");
      }
      return errorResponse(request, env, 405, "method_not_allowed", "Method not allowed.");
    } catch {
      return errorResponse(request, env, 500, "internal_error", "Something went wrong.");
    }
  },
} satisfies ExportedHandler<Env>;
