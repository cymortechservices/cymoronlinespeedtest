export type Phase = "intro" | "home" | "testing" | "results";
export type Stage = "connecting" | "ping" | "download" | "upload" | "analyzing";

export interface Sample { t: number; mbps: number }

export interface PingResult {
  minMs: number; avgMs: number; maxMs: number; jitterMs: number;
  /** Failed HTTP probes / total probes, in percent. Browser estimate, NOT ICMP packet loss. */
  requestLossPercent: number;
  samplesMs: number[];
  sent: number;
}

export interface ThroughputResult { mbps: number; bytes: number; durationMs: number; samples: Sample[] }

export interface ConnectionInfo {
  ip: string | null; ipVersion: 4 | 6 | null; isp: string | null; asn: number | null;
  country: string | null; region: string | null; city: string | null;
  server: { provider: string; colo: string | null; httpProtocol: string | null };
}

export interface TestResult {
  ping: PingResult;
  download: ThroughputResult;
  upload: ThroughputResult;
  info: ConnectionInfo | null;
  finishedAt: number;
}

export type Rating = "Excellent" | "Good" | "Fair" | "Poor";
export interface UseCase { id: string; label: string; rating: Rating; reason: string }
export interface Score { total: number; label: "Excellent" | "Very Good" | "Good" | "Fair" | "Poor"; parts: Record<string, number> }
