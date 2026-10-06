import { API_BASE } from "../lib/config";
import type { Sample, ThroughputResult } from "../lib/types";
import { runMeter } from "./meter";
import { makeRandomBlob } from "./payload";

const STREAMS = 3;
const REQUEST_BYTES = 4 * 1024 * 1024;
const DURATION_MS = 7000;
const WARMUP_MS = 1500;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

/**
 * XMLHttpRequest is used because it exposes upload progress in every browser
 * (fetch upload streaming needs HTTP/2 + duplex support).
 * Caveat: progress events count bytes handed to the network stack, which can
 * run slightly ahead of what the server has acknowledged. Averaging over the
 * steady-state window after warmup keeps that bias small; see README.
 */
export async function runUpload(signal: AbortSignal, onSample: (s: Sample) => void): Promise<ThroughputResult> {
  const blob = makeRandomBlob(REQUEST_BYTES);
  let completed = 0;
  const inFlight = new Map<number, number>();
  const stop = new AbortController();
  const any = AbortSignal.any([signal, stop.signal]);
  let failure: unknown = null;

  const total = () => completed + [...inFlight.values()].reduce((a, b) => a + b, 0);

  const sendOnce = (id: number, n: number) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/upload?r=${Date.now()}-${id}-${n}`);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.upload.onprogress = (e) => inFlight.set(id, e.loaded);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          completed += REQUEST_BYTES;
          inFlight.set(id, 0);
          resolve();
        } else reject(new Error(`upload ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("upload network error"));
      xhr.onabort = () => resolve();
      any.addEventListener("abort", () => xhr.abort(), { once: true });
      xhr.send(blob);
    });

  const worker = async (id: number) => {
    let n = 0;
    while (!any.aborted) await sendOnce(id, n++);
  };

  const tasks = Array.from({ length: STREAMS }, (_, i) => worker(i));
  tasks.forEach((t) => t.catch((e) => { failure = e; stop.abort(); }));

  const result = await runMeter({
    getBytes: total, durationMs: DURATION_MS, warmupMs: WARMUP_MS, signal: any, onSample,
    shouldStop: () => total() >= MAX_TOTAL_BYTES,
  });
  stop.abort();
  await Promise.allSettled(tasks);
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (failure || result.bytes === 0) throw new Error("Upload test failed");
  return result;
}
