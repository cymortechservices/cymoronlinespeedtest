import { API_BASE } from "../lib/config";
import type { Sample, ThroughputResult } from "../lib/types";
import { runMeter } from "./meter";

const STREAMS = 4;
const REQUEST_BYTES = 20 * 1024 * 1024;
const DURATION_MS = 8000;
const WARMUP_MS = 1500;
/** Safety cap so very fast links do not transfer unbounded data. */
const MAX_TOTAL_BYTES = 600 * 1024 * 1024;

/**
 * Opens several parallel streams (one is rarely enough to fill a fast link),
 * each repeatedly fetching random data from the Worker. Unique query strings
 * plus no-store headers prevent caching from distorting the result.
 */
export async function runDownload(signal: AbortSignal, onSample: (s: Sample) => void): Promise<ThroughputResult> {
  let bytes = 0;
  const stop = new AbortController();
  const any = AbortSignal.any([signal, stop.signal]);

  const worker = async (id: number) => {
    let n = 0;
    while (!any.aborted) {
      try {
        const res = await fetch(`${API_BASE}/api/download?bytes=${REQUEST_BYTES}&r=${Date.now()}-${id}-${n++}`, { cache: "no-store", signal: any });
        if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
        }
      } catch (e) {
        if (any.aborted) return;
        throw e;
      }
    }
  };

  const tasks = Array.from({ length: STREAMS }, (_, i) => worker(i));
  let failure: unknown = null;
  tasks.forEach((t) => t.catch((e) => { failure = e; stop.abort(); }));

  const result = await runMeter({
    getBytes: () => bytes, durationMs: DURATION_MS, warmupMs: WARMUP_MS, signal: any, onSample,
    shouldStop: () => bytes >= MAX_TOTAL_BYTES,
  });
  stop.abort();
  await Promise.allSettled(tasks);
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (failure || result.bytes === 0) throw new Error("Download test failed");
  return result;
}
