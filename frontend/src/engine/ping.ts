import { API_BASE } from "../lib/config";
import { latencyStats, round } from "../lib/stats";
import type { PingResult } from "../lib/types";

const PROBES = 20;
const TIMEOUT_MS = 2500;

/**
 * Latency = time for a tiny HTTPS request to /api/health to complete.
 * The first request pays for DNS/TLS setup, so it is sent but excluded from
 * the stats. Failed or timed-out probes count toward "request loss", which is
 * an HTTP-level estimate and NOT ICMP packet loss.
 */
export async function runPing(signal: AbortSignal, onProgress: (done: number, total: number, lastMs: number | null) => void): Promise<PingResult> {
  const samples: number[] = [];
  let failed = 0;
  let measured = 0;

  for (let i = 0; i < PROBES + 1; i++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_BASE}/api/health?r=${Date.now()}-${i}`, {
        cache: "no-store",
        signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
      });
      await res.arrayBuffer();
      if (!res.ok) throw new Error("bad status");
      const ms = performance.now() - t0;
      if (i > 0) { samples.push(ms); measured++; }
      onProgress(i, PROBES, i > 0 ? ms : null);
    } catch (e) {
      if (signal.aborted) throw e;
      if (i > 0) { failed++; measured++; }
      onProgress(i, PROBES, null);
    }
  }

  if (samples.length === 0) throw new Error("All latency probes failed");
  const s = latencyStats(samples);
  return {
    minMs: round(s.minMs), avgMs: round(s.avgMs), maxMs: round(s.maxMs), jitterMs: round(s.jitterMs),
    requestLossPercent: round((failed / measured) * 100),
    samplesMs: samples, sent: measured,
  };
}
