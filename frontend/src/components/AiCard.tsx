import { Sparkles } from "lucide-react";
import type { UseCase } from "../lib/types";

export type AiState = { status: "loading" } | { status: "ok"; text: string; model: string } | { status: "error"; message: string };

const tone: Record<string, string> = { Excellent: "text-emerald-300", Good: "text-cyan", Fair: "text-amber-300", Poor: "text-rose-300" };

export function AiCard({ ai, useCases }: { ai: AiState; useCases: UseCase[] }) {
  return (
    <section aria-labelledby="ai-h" className="rounded-3xl border border-violet/50 bg-gradient-to-br from-violet/15 via-panel to-cyan/10 p-6 sm:p-8">
      <h2 id="ai-h" className="flex items-center gap-2 text-sm font-semibold text-cyan"><Sparkles className="h-4 w-4" aria-hidden="true" /> AI network analysis</h2>
      <div className="mt-4 min-h-[5rem]" aria-live="polite">
        {ai.status === "loading" && <p className="blink text-mist">Writing your analysis...</p>}
        {ai.status === "ok" && <p className="text-lg leading-relaxed">{ai.text}</p>}
        {ai.status === "error" && (
          <div>
            <p className="font-semibold">AI analysis temporarily unavailable</p>
            <p className="mt-1 text-sm text-mist">{ai.message} Your technical test results are still available.</p>
          </div>
        )}
      </div>
      <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {useCases.map((u) => (
          <div key={u.id} className="flex items-baseline justify-between border-b border-edge/70 py-2" title={u.reason}>
            <dt className="text-mist">{u.label}</dt>
            <dd className={`font-semibold ${tone[u.rating]}`}>{u.rating}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-mist">
        {ai.status === "ok" ? `Explanation generated with Google Gemini (${ai.model}). ` : ""}Ratings come from fixed thresholds applied to your measurements, not from the AI.
      </p>
    </section>
  );
}
