import { useEffect, useState } from "react";
import { useReducedMotion } from "../lib/useReducedMotion";

// Decorative values only: they are NOT measurements, and the screen says so.
const SEQUENCE = ["12.4 Mbps", "48.7 Mbps", "92.1 Mbps", "7 ms", "143.8 Mbps"];

export function Intro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) { const t = setTimeout(onDone, 400); return () => clearTimeout(t); }
    const step = setInterval(() => setI((v) => Math.min(v + 1, SEQUENCE.length - 1)), 260);
    const end = setTimeout(onDone, 1700);
    return () => { clearInterval(step); clearTimeout(end); };
  }, [reduced, onDone]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink" role="status" aria-label="Loading CYMOR Internet Speed Test">
      <div className="text-center">
        <h1 className="sheen bg-clip-text text-transparent text-6xl sm:text-8xl font-extrabold tracking-tight">CYMOR</h1>
        <p aria-hidden="true" className="num mt-5 h-8 text-2xl text-cyan">{reduced ? "" : SEQUENCE[i]}</p>
        <p className="mt-1 text-xs text-mist">Intro animation. These numbers are not measurements.</p>
      </div>
      <button onClick={onDone} className="absolute bottom-8 right-6 rounded-full border border-edge px-4 py-2 text-sm text-mist hover:text-white">Skip intro</button>
    </div>
  );
}
