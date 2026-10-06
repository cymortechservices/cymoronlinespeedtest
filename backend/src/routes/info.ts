import type { Env } from "../types";
import { json } from "../http";

/**
 * GET /api/info
 * Reflects what Cloudflare already knows about the connection. Nothing is
 * stored or logged, and no third-party IP/ISP service is needed.
 */
export function info(request: Request, env: Env): Response {
  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;
  const ip = request.headers.get("CF-Connecting-IP") ?? null;
  return json(request, env, {
    ip,
    ipVersion: ip ? (ip.includes(":") ? 6 : 4) : null,
    isp: cf?.asOrganization ?? null,
    asn: cf?.asn ?? null,
    country: cf?.country ?? null,
    region: cf?.region ?? null,
    city: cf?.city ?? null,
    server: {
      provider: "Cloudflare edge",
      colo: cf?.colo ?? null, // IATA code of the data center that served this request
      httpProtocol: cf?.httpProtocol ?? null,
    },
  });
}
