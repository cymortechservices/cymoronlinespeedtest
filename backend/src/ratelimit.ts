/**
 * Best-effort, per-isolate sliding-window rate limiter.
 *
 * LIMITATION: Worker isolates are not shared, so this is NOT a global limit.
 * It blunts casual abuse. For hard guarantees use Cloudflare WAF rate-limiting
 * rules or the Workers Rate Limiting binding (see README, "Security").
 */
const buckets = new Map<string, number[]>();

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

/** The IP is used only as an in-memory key. It is never logged or stored. */
export function clientKey(request: Request, scope: string): string {
  return `${scope}:${request.headers.get("CF-Connecting-IP") ?? "unknown"}`;
}
