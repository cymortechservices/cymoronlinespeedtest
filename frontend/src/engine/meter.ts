import { toMbps } from "../lib/stats";
import type { Sample, ThroughputResult } from "../lib/types";

interface MeterOptions {
  /** Returns the cumulative number of bytes transferred so far. */
  getBytes: () => number;
  durationMs: number;
  /** Bytes moved before this point are ignored in the final figure (TCP slow start, connection setup). */
  warmupMs: number;
  signal: AbortSignal;
  onSample: (s: Sample) => void;
  /** Called every tick; return true to end the test early. */
  shouldStop?: () => boolean;
}

const TICK_MS = 200;
const WINDOW_MS = 800;

/**
 * Samples a cumulative byte counter every 200 ms. Live samples are Mbps over a
 * trailing 800 ms window, so the graph shows real, smoothed throughput.
 * The final figure is the average over the steady-state part of the test
 * (after warmup): (bytes at end - bytes at warmup) * 8 / elapsed.
 */
export function runMeter(o: MeterOptions): Promise<ThroughputResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const points: { t: number; b: number }[] = [{ t: 0, b: 0 }];
    const samples: Sample[] = [];
    let warm: { t: number; b: number } | null = null;

    const finish = () => {
      clearInterval(timer);
      const last = points[points.length - 1];
      const base = warm ?? points[0];
      const ms = last.t - base.t;
      const bytes = last.b - base.b;
      resolve({ mbps: toMbps(bytes, ms), bytes: last.b, durationMs: last.t, samples });
    };

    const timer = setInterval(() => {
      const t = performance.now() - start;
      const b = o.getBytes();
      points.push({ t, b });
      if (!warm && t >= o.warmupMs) warm = { t, b };
      const from = [...points].reverse().find((p) => t - p.t >= WINDOW_MS) ?? points[0];
      const s = { t: t / 1000, mbps: toMbps(b - from.b, t - from.t) };
      samples.push(s);
      o.onSample(s);
      if (t >= o.durationMs || o.signal.aborted || o.shouldStop?.()) finish();
    }, TICK_MS);
  });
}
