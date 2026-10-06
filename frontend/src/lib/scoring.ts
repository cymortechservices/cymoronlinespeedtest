import type { PingResult, Score } from "./types";

/**
 * CONNECTION SCORE (deterministic, 0-100)
 *
 * Each metric is converted to a 0-100 sub-score by linear interpolation
 * between the anchor points below, then combined with fixed weights:
 *
 *   download 30% | upload 20% | ping 25% | jitter 15% | reliability 10%
 *
 * Reliability = 100 - 20 x (failed probe %), floored at 0
 * (5% failed HTTP probes -> 0). Same inputs always give the same score.
 *
 * Labels: >=90 Excellent, >=75 Very Good, >=55 Good, >=35 Fair, else Poor.
 */
type Anchors = ReadonlyArray<readonly [number, number]>;

export const ANCHORS = {
  download: [[0, 0], [5, 20], [25, 60], [100, 90], [300, 100]],
  upload: [[0, 0], [1, 15], [5, 40], [20, 75], [50, 95], [100, 100]],
  ping: [[0, 100], [20, 100], [50, 85], [100, 55], [200, 20], [400, 0]],
  jitter: [[0, 100], [5, 100], [15, 80], [30, 50], [60, 10], [100, 0]],
} as const satisfies Record<string, Anchors>;

export const WEIGHTS = { download: 0.3, upload: 0.2, ping: 0.25, jitter: 0.15, reliability: 0.1 } as const;

export function interpolate(anchors: Anchors, x: number): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    const [x0, y0] = anchors[i - 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return anchors[anchors.length - 1][1];
}

export function labelFor(total: number): Score["label"] {
  if (total >= 90) return "Excellent";
  if (total >= 75) return "Very Good";
  if (total >= 55) return "Good";
  if (total >= 35) return "Fair";
  return "Poor";
}

export function computeScore(m: { downloadMbps: number; uploadMbps: number; ping: Pick<PingResult, "avgMs" | "jitterMs" | "requestLossPercent"> }): Score {
  const parts = {
    download: interpolate(ANCHORS.download, m.downloadMbps),
    upload: interpolate(ANCHORS.upload, m.uploadMbps),
    ping: interpolate(ANCHORS.ping, m.ping.avgMs),
    jitter: interpolate(ANCHORS.jitter, m.ping.jitterMs),
    reliability: Math.max(0, 100 - 20 * m.ping.requestLossPercent),
  };
  const total = Math.round(
    parts.download * WEIGHTS.download + parts.upload * WEIGHTS.upload + parts.ping * WEIGHTS.ping +
      parts.jitter * WEIGHTS.jitter + parts.reliability * WEIGHTS.reliability,
  );
  return { total, label: labelFor(total), parts };
}
