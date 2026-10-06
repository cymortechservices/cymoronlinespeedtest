import { Gauge, Radar, Sparkles } from "lucide-react";

export function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-full flex flex-col items-center justify-center px-5 py-16 text-center">
      <p className="rise text-sm font-semibold text-cyan">CYMOR Internet Speed Test</p>
      <h1 className="rise mt-4 max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight" style={{ animationDelay: ".05s" }}>
        How fast is your internet, really?
      </h1>
      <p className="rise mt-6 max-w-xl text-base sm:text-lg text-mist" style={{ animationDelay: ".12s" }}>
        Test your connection, understand your network, and discover what your internet can actually handle.
      </p>

      <div className="rise relative mt-12" style={{ animationDelay: ".2s" }}>
        <button
          onClick={onStart}
          className="pulse-ring cta-glow sheen relative rounded-full px-8 py-5 sm:px-12 sm:py-7 text-base sm:text-xl font-extrabold text-ink transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          TEST YOUR INTERNET SPEED NOW
        </button>
      </div>
      <p className="rise mt-5 text-xs text-mist" style={{ animationDelay: ".28s" }}>Uses about 100 to 600 MB of data on fast connections. Takes around 25 seconds.</p>

      <ul className="rise mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3 text-left" style={{ animationDelay: ".35s" }}>
        {[
          { Icon: Gauge, t: "Real measurements", d: "Download, upload, ping and jitter measured against a Cloudflare edge server. Nothing is simulated." },
          { Icon: Radar, t: "What it means for you", d: "Gaming, 4K, video calls, streaming and uploads rated against published thresholds." },
          { Icon: Sparkles, t: "Plain-English analysis", d: "Gemini explains your numbers. It reads the results, it never changes them." },
        ].map(({ Icon, t, d }) => (
          <li key={t} className="glass rounded-3xl p-5">
            <Icon className="h-5 w-5 text-cyan" aria-hidden="true" />
            <h2 className="mt-3 font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-mist">{d}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
