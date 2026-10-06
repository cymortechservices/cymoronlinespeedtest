import type { Rating, UseCase } from "./types";

/** Thresholds are documented per function and mirrored in the README. */
export interface Metrics { down: number; up: number; ping: number; jitter: number; loss: number }

const mk = (id: string, label: string, rating: Rating, reason: string): UseCase => ({ id, label, rating, reason });

/** Excellent: ping<=30, jitter<=10, loss<=0.5, down>=15. Good: ping<=60, jitter<=20, down>=5. Fair: ping<=100, jitter<=40. */
export function evaluateGaming(m: Metrics): UseCase {
  if (m.ping <= 30 && m.jitter <= 10 && m.loss <= 0.5 && m.down >= 15) return mk("gaming", "Online gaming", "Excellent", "Low latency and steady response times.");
  if (m.ping <= 60 && m.jitter <= 20 && m.down >= 5) return mk("gaming", "Online gaming", "Good", "Playable for most games; fast-paced shooters may feel less crisp.");
  if (m.ping <= 100 && m.jitter <= 40) return mk("gaming", "Online gaming", "Fair", "Noticeable delay in competitive games.");
  return mk("gaming", "Online gaming", "Poor", "High or unstable latency will cause lag.");
}

/** Download Mbps. Excellent >=50 (4K with headroom), Good >=25 (4K), Fair >=8 (HD), else Poor. */
export function evaluateStreaming(m: Metrics): UseCase {
  if (m.down >= 50) return mk("streaming", "4K streaming", "Excellent", "Enough for 4K with room for other devices.");
  if (m.down >= 25) return mk("streaming", "4K streaming", "Good", "Meets typical 4K requirements (about 25 Mbps).");
  if (m.down >= 8) return mk("streaming", "4K streaming", "Fair", "HD is fine; 4K may buffer.");
  return mk("streaming", "4K streaming", "Poor", "Expect SD quality or buffering.");
}

/** Excellent: down>=10, up>=10, ping<=60, jitter<=20. Good: down>=3, up>=3, ping<=120, jitter<=40. Fair: up>=1, down>=1. */
export function evaluateVideoCalls(m: Metrics): UseCase {
  if (m.down >= 10 && m.up >= 10 && m.ping <= 60 && m.jitter <= 20) return mk("calls", "Video calls", "Excellent", "HD group calls should be smooth.");
  if (m.down >= 3 && m.up >= 3 && m.ping <= 120 && m.jitter <= 40) return mk("calls", "Video calls", "Good", "Fine for one-to-one and small group calls.");
  if (m.down >= 1 && m.up >= 1) return mk("calls", "Video calls", "Fair", "Video may drop in quality; audio should hold.");
  return mk("calls", "Video calls", "Poor", "Calls will likely freeze or drop.");
}

/** Excellent: down>=25 and ping<=60. Good: down>=10 and ping<=120. Fair: down>=3. */
export function evaluateBrowsing(m: Metrics): UseCase {
  if (m.down >= 25 && m.ping <= 60) return mk("browsing", "Web browsing", "Excellent", "Pages should load almost instantly.");
  if (m.down >= 10 && m.ping <= 120) return mk("browsing", "Web browsing", "Good", "Pages load quickly.");
  if (m.down >= 3) return mk("browsing", "Web browsing", "Fair", "Heavy pages may feel slow.");
  return mk("browsing", "Web browsing", "Poor", "Pages will be slow to load.");
}

/** Upload Mbps. Excellent >=50, Good >=20, Fair >=5, else Poor. */
export function evaluateFileTransfers(m: Metrics): UseCase {
  if (m.up >= 50) return mk("uploads", "Large file uploads", "Excellent", "A 1 GB file uploads in about 3 minutes or less.");
  if (m.up >= 20) return mk("uploads", "Large file uploads", "Good", "A 1 GB file uploads in under 7 minutes.");
  if (m.up >= 5) return mk("uploads", "Large file uploads", "Fair", "Large uploads take a while.");
  return mk("uploads", "Large file uploads", "Poor", "Uploads will be slow.");
}

/** Upload Mbps and jitter. Excellent: up>=10 and jitter<=20. Good: up>=5. Fair: up>=3. */
export function evaluateLiveStreaming(m: Metrics): UseCase {
  if (m.up >= 10 && m.jitter <= 20) return mk("live", "Live streaming", "Excellent", "Supports 1080p streaming.");
  if (m.up >= 5) return mk("live", "Live streaming", "Good", "720p streaming should work.");
  if (m.up >= 3) return mk("live", "Live streaming", "Fair", "Stick to lower bitrates.");
  return mk("live", "Live streaming", "Poor", "Upload is too low for stable streaming.");
}

export function evaluateAll(m: Metrics): UseCase[] {
  return [evaluateGaming(m), evaluateStreaming(m), evaluateVideoCalls(m), evaluateBrowsing(m), evaluateLiveStreaming(m), evaluateFileTransfers(m)];
}
