import type { LiveState } from "../engine/useSpeedTest";
import { formatMbps } from "../lib/stats";
import type { Stage } from "../lib/types";
import { LiveGraph } from "./LiveGraph";

const STAGE_TEXT: Record<Stage, string> = {
  connecting: "CONNECTING...", ping: "TESTING PING", download: "TESTING DOWNLOAD", upload: "TESTING UPLOAD", analyzing: "ANALYZING CONNECTION",
};
const ORDER: Stage[] = ["connecting", "ping", "download", "upload", "analyzing"];

/** Log-scaled 270 degree arc: 1 Mbps to 1 Gbps. */
function fraction(mbps: number) { return Math.min(1, Math.log10(1 + mbps) / 3); }

function Gauge({ value, unit, caption, active }: { value: string; unit: string; caption: string; active: number }) {
  const R = 118, C = 2 * Math.PI * R, arc = C * 0.75;
  return (
    <div className="relative mx-auto aspect-square w-[min(78vw,20rem)]">
      <svg viewBox="0 0 280 280" className="absolute inset-0 h-full w-full -rotate-[225deg]" aria-hidden="true">
        <defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stopColor="#22D3EE" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
        <circle cx="140" cy="140" r={R} fill="none" stroke="#1E2A44" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${arc} ${C}`} />
        <circle cx="140" cy="140" r={R} fill="none" stroke="url(#gg)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${arc * active} ${C}`} style={{ transition: "stroke-dasharray .25s linear", filter: "drop-shadow(0 0 10px rgba(34,211,238,.6))" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-xs font-semibold text-mist">{caption}</p>
          <p className="num text-6xl sm:text-7xl font-extrabold">{value}</p>
          <p className="text-lg text-cyan">{unit}</p>
        </div>
      </div>
    </div>
  );
}

export function TestScreen({ live, error, onCancel, onRetry }: { live: LiveState; error: string | null; onCancel: () => void; onRetry: () => void }) {
  const { stage } = live;
  const idx = ORDER.indexOf(stage);
  const inPing = stage === "ping" || stage === "connecting";
  const main = inPing
    ? { v: live.currentPingMs == null ? "--" : String(Math.round(live.currentPingMs)), u: "ms", c: "PING", a: Math.min(1, (live.currentPingMs ?? 0) / 200) }
    : { v: formatMbps(live.currentMbps), u: "Mbps", c: stage === "upload" ? "UPLOAD" : stage === "download" ? "DOWNLOAD" : "RESULT", a: fraction(live.currentMbps) };

  if (error) {
    return (
      <main className="min-h-full grid place-items-center px-5">
        <div role="alert" className="glass rounded-3xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-extrabold">The test could not finish</h1>
          <p className="mt-3 text-mist">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={onRetry} className="sheen rounded-full px-6 py-3 font-semibold text-ink">Try again</button>
            <button onClick={onCancel} className="rounded-full border border-edge px-6 py-3 text-mist hover:text-white">Back</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center gap-6 px-5 py-10">
      <p className="blink text-sm font-semibold text-cyan" role="status" aria-live="polite">{STAGE_TEXT[stage]}</p>
      <ol className="flex gap-2" aria-label="Test progress">
        {ORDER.map((s, i) => <li key={s} className={`h-1.5 w-8 sm:w-12 rounded-full ${i <= idx ? "sheen" : "bg-edge"}`} aria-current={i === idx ? "step" : undefined}><span className="sr-only">{s}</span></li>)}
      </ol>
      <Gauge value={main.v} unit={main.u} caption={main.c} active={main.a} />
      <div className="grid w-full max-w-xl grid-cols-3 gap-3 text-center">
        {[
          { l: "Ping", v: live.ping ? `${Math.round(live.ping.avgMs)} ms` : "--" },
          { l: "Download", v: live.download ? `${formatMbps(live.download.mbps)} Mbps` : "--" },
          { l: "Upload", v: live.upload ? `${formatMbps(live.upload.mbps)} Mbps` : "--" },
        ].map((x) => <div key={x.l} className="glass rounded-2xl py-3"><p className="text-xs text-mist">{x.l}</p><p className="num font-semibold">{x.v}</p></div>)}
      </div>
      <div className="glass w-full max-w-xl rounded-3xl p-4">
        {stage === "download" || stage === "upload" ? <LiveGraph samples={live.samples} label={stage === "download" ? "Download" : "Upload"} /> : <p className="py-10 text-center text-sm text-mist">The live graph appears when throughput testing starts.</p>}
      </div>
      <button onClick={onCancel} className="text-sm text-mist underline underline-offset-4 hover:text-white">Cancel test</button>
    </main>
  );
}
