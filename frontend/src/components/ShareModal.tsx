import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import { canvasToBlob, drawShareCard, shareText, type ShareData } from "../lib/share";

export function ShareModal({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [includeIp, setIncludeIp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const text = shareText(data);
  const site = window.location.origin;

  useEffect(() => {
    // Wait for the web font so the card does not render with fallback type.
    (document.fonts?.ready ?? Promise.resolve()).then(() => canvasRef.current && drawShareCard(canvasRef.current, data, includeIp));
  }, [data, includeIp]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const download = async () => {
    const blob = await canvasToBlob(canvasRef.current!);
    if (!blob) return setNote("Could not create the image.");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "cymor-speed-test.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const nativeShare = async () => {
    try {
      const blob = await canvasToBlob(canvasRef.current!);
      const file = blob ? new File([blob], "cymor-speed-test.png", { type: "image/png" }) : null;
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
      else await navigator.share({ text, url: site });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNote("Sharing was blocked by the browser. Use download or copy instead.");
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setNote("Copy is not available in this browser."); }
  };

  const btn = "inline-flex items-center justify-center gap-2 rounded-full border border-edge px-4 py-2.5 text-sm font-semibold hover:border-cyan";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Share your result">
      <div className="glass w-full max-w-2xl rounded-3xl p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Share your result</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-mist hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <canvas ref={canvasRef} className="mt-4 w-full rounded-2xl border border-edge" style={{ aspectRatio: "1200 / 630" }} aria-label="Preview of your share card" />
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input type="checkbox" checked={includeIp} onChange={(e) => setIncludeIp(e.target.checked)} disabled={!data.ip} className="h-4 w-4 accent-cyan" />
          Show my public IP on the card {!data.ip && <span className="text-mist">(not available)</span>}
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          {typeof navigator.share === "function" && <button onClick={nativeShare} className={`${btn} sheen border-transparent text-ink`}><Share2 className="h-4 w-4" /> Share</button>}
          <button onClick={download} className={btn}><Download className="h-4 w-4" /> Download image</button>
          <button onClick={copy} className={btn}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy result"}</button>
          <a className={btn} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${site}`)}`}>WhatsApp</a>
          <a className={btn} target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(site)}`}>X</a>
          <a className={btn} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(site)}`}>Facebook</a>
        </div>
        <p className="mt-3 text-xs text-mist">Links share the text and this site's address. Results are not stored on a server, so there is no permanent result link. Attach the downloaded image for the full card.</p>
        {note && <p role="alert" className="mt-2 text-sm text-amber-300">{note}</p>}
      </div>
    </div>
  );
}
