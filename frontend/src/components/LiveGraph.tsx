import type { Sample } from "../lib/types";

/** SVG line graph drawn from real samples collected during the current stage. */
export function LiveGraph({ samples, label }: { samples: Sample[]; label: string }) {
  const W = 600, H = 140, P = 6;
  const max = Math.max(10, ...samples.map((s) => s.mbps)) * 1.15;
  const tMax = Math.max(8, samples.at(-1)?.t ?? 0);
  const pts = samples.map((s) => `${P + (s.t / tMax) * (W - 2 * P)},${H - P - (s.mbps / max) * (H - 2 * P)}`);
  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-28 sm:h-36 w-full" role="img" aria-label={`${label} speed over time`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lg" x1="0" x2="1"><stop offset="0" stopColor="#22D3EE" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient>
          <linearGradient id="fg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#22D3EE" stopOpacity=".28" /><stop offset="1" stopColor="#22D3EE" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#1E2A44" strokeDasharray="3 6" />)}
        {pts.length > 1 && (
          <>
            <polygon points={`${P},${H - P} ${pts.join(" ")} ${P + (samples.at(-1)!.t / tMax) * (W - 2 * P)},${H - P}`} fill="url(#fg)" />
            <polyline points={pts.join(" ")} fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-mist"><span>0 s</span><span>Live {label.toLowerCase()} throughput, peak scale {Math.round(max)} Mbps</span></figcaption>
    </figure>
  );
}
