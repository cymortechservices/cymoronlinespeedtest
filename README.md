# CYMOR Internet Speed Test

A real, browser-based internet speed test with plain-English analysis.

* **Frontend:** React + Vite + TypeScript + Tailwind, deployed to **Vercel**
* **Backend:** a **Cloudflare Worker** (Web APIs only, no Node server) that serves test traffic, reports IP/ISP, and proxies Gemini
* **AI:** Google **Gemini**, called only from the Worker. The key never reaches the browser.

```
                  VERCEL
              React Frontend
                    │  VITE_API_BASE_URL
                    ▼
             CLOUDFLARE WORKER
                    │
   ┌──────────┬─────┴─────┬───────────┐
   ▼          ▼           ▼           ▼
 /download  /upload   /health+/info  /analyze
 (random    (counted  (latency,      (validated,
  bytes)     then      IP, ISP,       rate-limited)
             dropped)  edge colo)         │
                                          ▼
                                     GEMINI API
```

## Features

* Ping (min / avg / max) and jitter from 20 timed probes
* Download (4 parallel streams) and upload (3 parallel streams) with a live graph drawn from real 200 ms samples
* Request-loss estimate (see limitations)
* Public IP, ISP, ASN, approximate location and Cloudflare edge location, read from Cloudflare's own request metadata (no third-party IP service)
* Deterministic 0-100 connection score and six use-case ratings
* Gemini explanation card. If Gemini fails, the test and all results still work.
* Branded 1200x630 share card (PNG), Web Share API, copy, WhatsApp, X, Facebook; the IP is shown on the card only if the user opts in
* Animated intro (skippable), network-line background, reduced-motion support, keyboard and screen-reader support, responsive from 320 px

## What is measured, and how

| Metric | Method |
|---|---|
| Ping | Round-trip time of a tiny HTTPS request to `/api/health`. The first request (DNS/TLS setup) is discarded. |
| Jitter | Mean absolute difference between consecutive ping samples. |
| Download | Parallel `fetch` streams of random bytes from `/api/download` (no-store, unique URLs, no compression). Final value = average over the steady state after a 1.5 s warm-up. `Mbps = bytes * 8 / seconds / 1,000,000`. |
| Upload | Parallel `XMLHttpRequest` uploads of random data to `/api/upload`, discarded server-side. Same warm-up rule. |
| Request loss | Failed or timed-out ping probes / total probes. |

### Honest limitations

* **Packet loss:** browsers cannot send ICMP. The app reports *request loss*, labelled as an HTTP-level estimate. It is not equal to true packet loss.
* **Upload bias:** `XMLHttpRequest` progress counts bytes handed to the network stack, which can run slightly ahead of what the server has received. Averaging after warm-up keeps the bias small, but upload can read a little high on connections with large buffers.
* **Scope:** results describe the path between your browser and one Cloudflare edge server, not your ISP's whole network.
* **Browser support:** needs `AbortSignal.any` / `AbortSignal.timeout` (Chrome 116+, Edge 116+, Firefox 124+, Safari 17.4+).
* **Test data volume:** a fast link can move several hundred MB per test. Caps are 600 MB down and 200 MB up per run.

## Scoring (also documented in `frontend/src/lib/scoring.ts`)

Each metric is mapped to 0-100 by linear interpolation between fixed anchors, then weighted:

| Metric | Weight | Anchors (value → points) |
|---|---|---|
| Download (Mbps) | 30% | 0→0, 5→20, 25→60, 100→90, 300→100 |
| Upload (Mbps) | 20% | 0→0, 1→15, 5→40, 20→75, 50→95, 100→100 |
| Ping (ms, lower is better) | 25% | 0-20→100, 50→85, 100→55, 200→20, 400→0 |
| Jitter (ms, lower is better) | 15% | 0-5→100, 15→80, 30→50, 60→10, 100→0 |
| Reliability | 10% | 100 - 20 × request-loss % (min 0) |

Labels: 90+ Excellent, 75+ Very Good, 55+ Good, 35+ Fair, otherwise Poor. Same inputs always give the same score.

## Use-case thresholds (`frontend/src/lib/usecases.ts`)

| Activity | Excellent | Good | Fair |
|---|---|---|---|
| Gaming | ping ≤ 30, jitter ≤ 10, loss ≤ 0.5%, down ≥ 15 | ping ≤ 60, jitter ≤ 20, down ≥ 5 | ping ≤ 100, jitter ≤ 40 |
| 4K streaming | down ≥ 50 | down ≥ 25 | down ≥ 8 |
| Video calls | down ≥ 10, up ≥ 10, ping ≤ 60, jitter ≤ 20 | down ≥ 3, up ≥ 3, ping ≤ 120, jitter ≤ 40 | down ≥ 1, up ≥ 1 |
| Web browsing | down ≥ 25, ping ≤ 60 | down ≥ 10, ping ≤ 120 | down ≥ 3 |
| Live streaming | up ≥ 10, jitter ≤ 20 | up ≥ 5 | up ≥ 3 |
| Large uploads | up ≥ 50 | up ≥ 20 | up ≥ 5 |

Anything below "Fair" is "Poor". Gemini does not decide these ratings.

## Requirements

* Node.js 20+ and npm, Git
* GitHub account (for Vercel import)
* Vercel account (free Hobby plan; has usage limits and non-commercial terms)
* Cloudflare account (Workers free plan has daily request and CPU limits; check current limits in the Cloudflare docs)
* Gemini API key from Google AI Studio (free tier has per-minute and per-day rate limits that can change)

Nothing here is promised to stay free or unlimited. Check each provider's current pricing.

## Local development

```bash
git clone YOUR_REPOSITORY
cd cymor-internet-speed-test

# 1. Backend (Terminal A)
cd backend
npm install
cp .dev.vars.example .dev.vars      # then paste your GEMINI_API_KEY into .dev.vars
npm run dev                         # Worker at http://localhost:8787

# 2. Frontend (Terminal B)
cd frontend
npm install
cp .env.example .env.local          # VITE_API_BASE_URL=http://localhost:8787
npm run dev                         # http://localhost:5173
```

`wrangler dev` does not require `wrangler login`. Locally the IP shows as a loopback address and ISP/colo may be empty, because Cloudflare metadata only exists on the real edge.

Run the pure-logic unit tests (scoring, stats, use cases): `cd frontend && npm test`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `frontend/.env.local`, Vercel project settings | Base URL of the Worker, no trailing slash. Public by design. |
| `GEMINI_API_KEY` | `backend/.dev.vars` (local), `wrangler secret put` (production) | Gemini key. **Secret.** Never in the frontend or the repo. |
| `ALLOWED_ORIGINS` | `[vars]` in `backend/wrangler.toml` or Cloudflare dashboard | Comma-separated browser origins allowed to call the API, e.g. `https://your-app.vercel.app,https://speed.example.com` |
| `GEMINI_MODEL` | `[vars]` in `wrangler.toml` | Model name, default `gemini-2.5-flash`. |

## Gemini setup

1. Open https://aistudio.google.com/apikey, sign in, create a key.
2. Local: put it in `backend/.dev.vars` as `GEMINI_API_KEY=...`.
3. Cloudflare: `cd backend && npx wrangler secret put GEMINI_API_KEY`, then paste the key.
4. Test the integration (replace the URL and origin):

```bash
curl -s -X POST https://YOUR-WORKER.workers.dev/api/analyze \
  -H "Origin: https://your-app.vercel.app" -H "Content-Type: application/json" \
  -d '{"downloadMbps":87.4,"uploadMbps":21.6,"pingMs":18,"jitterMs":4.2,"requestLossPercent":0}'
```

Expected: `{"analysis":"...","model":"gemini-2.5-flash"}`.

5. If the free-tier limit is reached, the Worker returns `ai_rate_limited`; the result page shows "AI analysis temporarily unavailable" and every measurement stays visible.

Only the five numbers and (optionally) the ISP name are sent to Gemini. The IP address is never sent.

## Deploy the backend to Cloudflare

```bash
cd backend
npm install
npx wrangler login                  # opens a browser to authorise
# Edit wrangler.toml: set ALLOWED_ORIGINS to your Vercel URL (add it after you have one; redeploy)
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

Wrangler prints the Worker URL, like `https://cymor-speedtest-api.YOUR-SUBDOMAIN.workers.dev`.

* **Verify it is live:** open `<worker-url>/api/health` in a browser. You should see `{"ok":true}`.
* **Dashboard:** Cloudflare dashboard → Workers & Pages → `cymor-speedtest-api`.
* **Secrets and variables:** that Worker → Settings → Variables and Secrets.
* **Logs:** Worker → Logs, or `npx wrangler tail` in a terminal.
* **Deployments:** Worker → Deployments.

## Deploy the frontend to Vercel

1. Push the repository to GitHub.
2. Vercel → Add New → Project → import the repo.
3. **Root Directory:** `frontend`.
4. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
5. Environment Variables: `VITE_API_BASE_URL` = your Worker URL (no trailing slash).
6. Deploy, then open the production URL.
7. Go back to `backend/wrangler.toml`, add the Vercel URL to `ALLOWED_ORIGINS`, and run `npm run deploy` again. Until you do, `/api/analyze` returns 403 and CORS blocks the test calls.

`VITE_` variables are baked in at build time, so redeploy Vercel after changing it.

## Custom domain (optional)

Point `speed.yourdomain.com` at Vercel: Vercel project → Settings → Domains → add it, then create the DNS record Vercel shows (usually a `CNAME` to `cname.vercel-dns.com`) at your DNS provider. Add `https://speed.yourdomain.com` to `ALLOWED_ORIGINS`. The API can stay on `workers.dev`, or get its own domain in the Worker's Settings → Domains & Routes.

## Security

* Gemini key lives only in a Worker secret. `/api/analyze` requires an allowed `Origin`, validates and range-checks the body (unknown fields dropped), caps body size, and has a fixed prompt, so it is not an open proxy.
* Test uploads are read and discarded; nothing is stored. IPs are never logged or stored; they are used in memory as rate-limit keys and returned to the requesting user only.
* Responses carry `no-store`, `nosniff`, HSTS, CSP and `no-referrer` headers. CORS is an allow-list. Errors return short codes, never internals.
* Per-request caps: 50 MB download, 25 MB upload.

**Free-tier limits you should know:**

* The built-in rate limiter is per Worker isolate, so it is best-effort, not a global guarantee. For real protection add a Cloudflare WAF rate-limiting rule on `/api/*`, or the Workers Rate Limiting binding.
* `Origin` can be forged by non-browser clients, so the Gemini endpoint can still be called by a determined script within the rate limit. Add Cloudflare Turnstile if abuse appears.
* The Worker cannot verify measurements; results are produced in the browser. Do not treat shared results as proof.

## Sharing

The share card and text are generated in the browser. There are **no permanent result links** in this MVP, because that needs storage (D1 or KV) and an anonymised ID scheme. A future version could store only the five metrics under a random ID in KV with an expiry. Nothing in the app shows a fake URL.

## Troubleshooting

**CORS errors / "API is unreachable":** the browser's exact origin (scheme + host, no trailing slash) must be in `ALLOWED_ORIGINS`. Redeploy the Worker after editing. Check `VITE_API_BASE_URL` has no trailing slash and was set before the Vercel build.

**Gemini errors:**
`ai_not_configured` means the secret is missing (`wrangler secret put GEMINI_API_KEY`).
`ai_key_or_request_rejected` means the key is invalid or the model name is wrong.
`ai_rate_limited` means the free quota is exhausted; wait or use a billed key.
`origin_not_allowed` means the page origin is not in `ALLOWED_ORIGINS`.

**Cloudflare deployment:** run `npx wrangler whoami`; if not logged in, `npx wrangler login`. On CI use a `CLOUDFLARE_API_TOKEN`. "Workers" must be enabled on the account (first deploy asks you to register a workers.dev subdomain).

**Vercel:** Root Directory must be `frontend`. A blank API URL in production means `VITE_API_BASE_URL` was missing at build time. Build failures usually come from a Node version below 18; set Node 20 in project settings.

**Strange results:** VPNs and proxies add a hop. Wi-Fi interference and distance from the router lower speeds; try Ethernet. Other devices and background downloads use bandwidth. Browser extensions and low-power phones can cap throughput. Your route to the nearest Cloudflare edge depends on your ISP's peering. Remember this measures your browser-to-edge path only.

## Project structure

```
backend/   Cloudflare Worker (src/index.ts, routes/, gemini.ts, http.ts, ratelimit.ts)
frontend/  React app (src/engine = measurements, src/lib = scoring/usecases/share, src/components = UI)
```

## Verification status

See the note delivered with this project: the Worker logic, scoring, statistics and throughput meter were tested in Node. The full frontend build and live end-to-end run still need `npm install` on your machine.
