import { formatMbps } from "./stats";

export interface ShareData {
  downloadMbps: number; uploadMbps: number; pingMs: number;
  score: number; label: string; ip: string | null;
}

export const shareText = (d: ShareData) =>
  `My internet: ${formatMbps(d.downloadMbps)} Mbps down, ${formatMbps(d.uploadMbps)} Mbps up, ${Math.round(d.pingMs)} ms ping. Score ${d.score}/100 (${d.label}). Tested with CYMOR Internet Speed Test.`;

/** Draws the 1200x630 branded card. The IP is drawn only when includeIp is true. */
export function drawShareCard(canvas: HTMLCanvasElement, d: ShareData, includeIp: boolean) {
  const W = 1200, H = 630;
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext("2d")!;
  const font = '"Sora", ui-sans-serif, system-ui, sans-serif';

  c.fillStyle = "#070A12"; c.fillRect(0, 0, W, H);
  const g1 = c.createRadialGradient(1000, 80, 0, 1000, 80, 600);
  g1.addColorStop(0, "rgba(139,92,246,.45)"); g1.addColorStop(1, "rgba(139,92,246,0)");
  c.fillStyle = g1; c.fillRect(0, 0, W, H);
  const g2 = c.createRadialGradient(120, 560, 0, 120, 560, 560);
  g2.addColorStop(0, "rgba(34,211,238,.35)"); g2.addColorStop(1, "rgba(34,211,238,0)");
  c.fillStyle = g2; c.fillRect(0, 0, W, H);

  c.strokeStyle = "rgba(154,167,194,.12)"; c.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }

  const grad = c.createLinearGradient(0, 0, 400, 0);
  grad.addColorStop(0, "#22D3EE"); grad.addColorStop(1, "#8B5CF6");
  c.fillStyle = grad; c.font = `800 44px ${font}`; c.fillText("CYMOR", 70, 100);
  c.fillStyle = "#9AA7C2"; c.font = `600 22px ${font}`; c.fillText("INTERNET SPEED TEST", 70, 134);

  c.fillStyle = "#E8EDF8"; c.font = `800 150px ${font}`; c.fillText(formatMbps(d.downloadMbps), 70, 320);
  const w = c.measureText(formatMbps(d.downloadMbps)).width;
  c.fillStyle = "#22D3EE"; c.font = `600 40px ${font}`; c.fillText("Mbps", 90 + w, 320);
  c.fillStyle = "#9AA7C2"; c.font = `600 26px ${font}`; c.fillText("DOWNLOAD", 70, 362);

  const stat = (x: number, value: string, unit: string, label: string) => {
    c.fillStyle = "#E8EDF8"; c.font = `800 56px ${font}`; c.fillText(value, x, 470);
    const vw = c.measureText(value).width;
    c.fillStyle = "#22D3EE"; c.font = `600 24px ${font}`; c.fillText(unit, x + vw + 10, 470);
    c.fillStyle = "#9AA7C2"; c.font = `600 22px ${font}`; c.fillText(label, x, 506);
  };
  stat(70, formatMbps(d.uploadMbps), "Mbps", "UPLOAD");
  stat(380, String(Math.round(d.pingMs)), "ms", "PING");

  c.fillStyle = "rgba(14,20,36,.85)"; c.strokeStyle = "#1E2A44"; c.lineWidth = 2;
  c.beginPath(); c.roundRect(800, 150, 330, 270, 28); c.fill(); c.stroke();
  c.textAlign = "center";
  c.fillStyle = grad; c.font = `800 110px ${font}`; c.fillText(`${d.score}`, 965, 285);
  c.fillStyle = "#9AA7C2"; c.font = `600 24px ${font}`; c.fillText("/ 100", 965, 322);
  c.fillStyle = "#E8EDF8"; c.font = `800 32px ${font}`; c.fillText(d.label.toUpperCase(), 965, 380);
  c.textAlign = "left";

  c.fillStyle = "#9AA7C2"; c.font = `400 22px ${font}`;
  c.fillText("Tested with CYMOR Internet Speed Test", 70, 580);
  if (includeIp && d.ip) { c.textAlign = "right"; c.fillText(`IP ${d.ip}`, 1130, 580); c.textAlign = "left"; }
}

export const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
