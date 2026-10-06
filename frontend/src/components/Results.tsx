import { useMemo, useState } from "react";
import { RotateCcw, Share2 } from "lucide-react";
import { computeScore } from "../lib/scoring";
import { formatMbps } from "../lib/stats";
import type { TestResult } from "../lib/types";
import { evaluateAll } from "../lib/usecases";
import { AiCard, type AiState } from "./AiCard";
import { ShareModal } from "./ShareModal";

function Stat({ label, value, unit, hint }: { label: string; value: string; unit: string; hint?: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="text-sm text-mist">{label}</p>
      <p className="num mt-1 text-3xl sm:text-4xl font-extrabold">{value}<span className="ml-1.5 text-base font-semibold text-cyan">{unit}</span></p>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export function Results({ r, ai, onAgain }: { r: TestResult; ai: AiState; onAgain: () => void }) {
  const [sharing, setSharing] = useState(false);
  const score = useMemo(() => computeScore({ downloadMbps: r.download.mbps, uploadMbps: r.upload.mbps, ping: r.ping }), [r]);
  const useCases = useMemo(() => evaluateAll({ down: r.download.mbps, up: r.upload.mbps, ping: r.ping.avgMs, jitter: r.ping.jitterMs, loss: r.ping.requestLossPercent }), [r]);
  const where = [r.info?.city, r.info?.region, r.info?.country].filter(Boolean).join(", ");
  const colo = r.info?.server.colo;

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="rise">
        <p className="text-sm font-semibold text-cyan">Your connection</p>
        <h1 className="num mt-2 text-6xl sm:text-8xl font-extrabold tracking-tight">{formatMbps(r.download.mbps)}<span className="ml-3 text-2xl sm:text-3xl text-cyan">Mbps download</span></h1>
      </header>

      <div className="rise mt-8 grid gap-4 md:grid-cols-[1fr_auto]" style={{ animationDelay: ".08s" }}>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Download" value={formatMbps(r.download.mbps)} unit="Mbps" />
          <Stat label="Upload" value={formatMbps(r.upload.mbps)} unit="Mbps" />
          <Stat label="Ping" value={String(Math.round(r.ping.avgMs))} unit="ms" hint={`Min ${Math.round(r.ping.minMs)}, max ${Math.round(r.ping.maxMs)} ms`} />
          <Stat label="Jitter" value={r.ping.jitterMs.toFixed(1)} unit="ms" />
        </div>
        <section aria-label="Connection score" className="glass flex flex-col items-center justify-center rounded-3xl px-10 py-6 text-center">
          <p className="text-sm text-mist">Connection score</p>
          <p className="sheen num mt-1 bg-clip-text text-7xl font-extrabold text-transparent">{score.total}<span className="text-2xl text-mist"> / 100</span></p>
          <p className="mt-1 text-lg font-semibold">{score.label}</p>
        </section>
      </div>

      <div className="rise mt-4 grid gap-4 sm:grid-cols-2" style={{ animationDelay: ".14s" }}>
        <div className="glass rounded-3xl p-5">
          <p className="text-sm text-mist">ISP</p>
          <p className="mt-1 font-semibold">{r.info?.isp ?? "Not available"}{r.info?.asn ? <span className="ml-2 text-sm font-normal text-mist">AS{r.info.asn}</span> : null}</p>
          <p className="mt-4 text-sm text-mist">Public IP{r.info?.ipVersion ? ` (IPv${r.info.ipVersion})` : ""}</p>
          <p className="num mt-1 break-all font-semibold">{r.info?.ip ?? "Not available"}</p>
          {where && <p className="mt-1 text-xs text-mist">Approximate location: {where}</p>}
        </div>
        <div className="glass rounded-3xl p-5">
          <p className="text-sm text-mist">Test server</p>
          <p className="mt-1 font-semibold">Cloudflare edge{colo ? `, ${colo}` : ""}</p>
          <p className="mt-1 text-xs text-mist">Nearest Cloudflare data center that answered. Exact server location is not known.{r.info?.server.httpProtocol ? ` Protocol ${r.info.server.httpProtocol}.` : ""}</p>
          <p className="mt-4 text-sm text-mist">Request loss (estimate)</p>
          <p className="num mt-1 font-semibold">{r.ping.requestLossPercent}% <span className="text-xs font-normal text-mist">of {r.ping.sent} HTTP probes failed</span></p>
          <p className="mt-1 text-xs text-mist">Browsers cannot measure true ICMP packet loss, so this counts failed or timed-out requests.</p>
        </div>
      </div>

      <div className="rise mt-4" style={{ animationDelay: ".2s" }}><AiCard ai={ai} useCases={useCases} /></div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={onAgain} className="sheen inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-extrabold text-ink"><RotateCcw className="h-4 w-4" aria-hidden="true" /> TEST AGAIN</button>
        <button onClick={() => setSharing(true)} className="inline-flex items-center gap-2 rounded-full border border-cyan/60 px-7 py-3.5 font-extrabold hover:bg-cyan/10"><Share2 className="h-4 w-4" aria-hidden="true" /> SHARE RESULT</button>
      </div>
      <p className="mt-8 max-w-2xl text-xs text-mist">This measures the path between your device and one Cloudflare edge server, not your ISP's whole network. VPNs, Wi-Fi, other devices and routing can change the numbers.</p>

      {sharing && <ShareModal onClose={() => setSharing(false)} data={{ downloadMbps: r.download.mbps, uploadMbps: r.upload.mbps, pingMs: r.ping.avgMs, score: score.total, label: score.label, ip: r.info?.ip ?? null }} />}
    </main>
  );
}
