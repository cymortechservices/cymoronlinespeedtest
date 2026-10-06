export interface Env {
  /** Secret. Set with `wrangler secret put GEMINI_API_KEY`. */
  GEMINI_API_KEY?: string;
  /** Comma-separated allowed browser origins. */
  ALLOWED_ORIGINS?: string;
  GEMINI_MODEL?: string;
}

export interface Metrics {
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  /** Percentage of failed HTTP probe requests (browser estimate, not ICMP). */
  requestLossPercent: number;
  isp?: string;
}
