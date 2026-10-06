export function latencyStats(samplesMs: number[]) {
  if (samplesMs.length === 0) return { minMs: 0, avgMs: 0, maxMs: 0, jitterMs: 0 };
  const min = Math.min(...samplesMs);
  const max = Math.max(...samplesMs);
  const avg = samplesMs.reduce((a, b) => a + b, 0) / samplesMs.length;
  // Jitter = mean absolute difference between consecutive samples (RFC 3550 style, unsmoothed).
  let diff = 0;
  for (let i = 1; i < samplesMs.length; i++) diff += Math.abs(samplesMs[i] - samplesMs[i - 1]);
  const jitter = samplesMs.length > 1 ? diff / (samplesMs.length - 1) : 0;
  return { minMs: min, avgMs: avg, maxMs: max, jitterMs: jitter };
}

/** Mbps = bytes * 8 / seconds / 1,000,000 */
export function toMbps(bytes: number, ms: number): number {
  return ms > 0 ? (bytes * 8) / (ms / 1000) / 1_000_000 : 0;
}

export function round(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function formatMbps(n: number): string {
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}
