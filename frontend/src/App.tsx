import { useCallback, useRef, useState } from "react";
import type { AiState } from "./components/AiCard";
import { Home } from "./components/Home";
import { Intro } from "./components/Intro";
import { NetworkBackground } from "./components/NetworkBackground";
import { Results } from "./components/Results";
import { TestScreen } from "./components/TestScreen";
import { useSpeedTest } from "./engine/useSpeedTest";
import { describeApiError, getAnalysis } from "./lib/api";
import type { Phase, TestResult } from "./lib/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [finished, setFinished] = useState<TestResult | null>(null);
  const [ai, setAi] = useState<AiState>({ status: "loading" });
  const runId = useRef(0);
  const { live, error, start, cancel } = useSpeedTest();

  const run = useCallback(async () => {
    const id = ++runId.current;
    setPhase("testing");
    setFinished(null);
    setAi({ status: "loading" });

    const r = await start();
    if (!r || id !== runId.current) return;

    // The AI explanation is an enhancement: wait briefly for it, then show results regardless.
    const analysis = getAnalysis({
      downloadMbps: r.download.mbps, uploadMbps: r.upload.mbps, pingMs: r.ping.avgMs, jitterMs: r.ping.jitterMs,
      requestLossPercent: r.ping.requestLossPercent, ...(r.info?.isp ? { isp: r.info.isp } : {}),
    })
      .then((a): AiState => ({ status: "ok", text: a.analysis, model: a.model }))
      .catch((e): AiState => ({ status: "error", message: describeApiError(e) }))
      .then((s) => { if (id === runId.current) setAi(s); });

    await Promise.all([sleep(900), Promise.race([analysis, sleep(4000)])]);
    if (id !== runId.current) return;
    setFinished(r);
    setPhase("results");
    window.scrollTo({ top: 0 });
  }, [start]);

  const back = useCallback(() => {
    runId.current++;
    cancel();
    setPhase("home");
  }, [cancel]);

  return (
    <>
      <NetworkBackground paused={phase === "testing"} />
      {phase === "intro" && <Intro onDone={() => setPhase("home")} />}
      {phase === "home" && <Home onStart={run} />}
      {phase === "testing" && <TestScreen live={live} error={error} onCancel={back} onRetry={run} />}
      {phase === "results" && finished && <Results r={finished} ai={ai} onAgain={run} />}
    </>
  );
}
