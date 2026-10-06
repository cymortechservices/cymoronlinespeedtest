import { useCallback, useEffect, useRef, useState } from "react";
import { getInfo } from "../lib/api";
import type { ConnectionInfo, PingResult, Sample, Stage, TestResult, ThroughputResult } from "../lib/types";
import { runDownload } from "./download";
import { runPing } from "./ping";
import { runUpload } from "./upload";

export interface LiveState {
  stage: Stage;
  currentMbps: number;
  currentPingMs: number | null;
  samples: Sample[];
  ping: PingResult | null;
  download: ThroughputResult | null;
  upload: ThroughputResult | null;
  info: ConnectionInfo | null;
}

const initial: LiveState = { stage: "connecting", currentMbps: 0, currentPingMs: null, samples: [], ping: null, download: null, upload: null, info: null };

export function useSpeedTest() {
  const [live, setLive] = useState<LiveState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(async (): Promise<TestResult | null> => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    // Full reset so no measurement leaks into the next run.
    setLive(initial);
    setResult(null);
    setError(null);

    try {
      const info = await getInfo().catch(() => null); // optional: the test works without it
      setLive((s) => ({ ...s, info }));

      setLive((s) => ({ ...s, stage: "ping" }));
      const ping = await runPing(ac.signal, (_d, _t, ms) => setLive((s) => ({ ...s, currentPingMs: ms ?? s.currentPingMs })));
      setLive((s) => ({ ...s, ping, currentPingMs: ping.avgMs, samples: [], currentMbps: 0 }));

      setLive((s) => ({ ...s, stage: "download" }));
      const download = await runDownload(ac.signal, (p) => setLive((s) => ({ ...s, currentMbps: p.mbps, samples: [...s.samples, p] })));
      setLive((s) => ({ ...s, download, currentMbps: download.mbps, samples: [] }));

      setLive((s) => ({ ...s, stage: "upload" }));
      const upload = await runUpload(ac.signal, (p) => setLive((s) => ({ ...s, currentMbps: p.mbps, samples: [...s.samples, p] })));
      setLive((s) => ({ ...s, upload, currentMbps: upload.mbps, stage: "analyzing" }));

      const r: TestResult = { ping, download, upload, info, finishedAt: Date.now() };
      setResult(r);
      return r;
    } catch (e) {
      if (ac.signal.aborted) return null;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg.includes("latency") ? "Could not reach the test server. Check your connection and the API address, then try again." : `${msg}. Check your connection and try again.`);
      return null;
    }
  }, []);

  return { live, result, error, start, cancel };
}
