# Costs

Goal: **$0 required spend** for personal, non-commercial use within free tiers. Visitors never pay. This file states what each service could cost and what stops it; it does not claim a guarantee where one does not exist.

## Services

| Service | Plan | What Accord uses | Main limits to watch |
|---|---|---|---|
| Vercel | Hobby (free, non-commercial) | Next.js hosting, functions | Monthly function and bandwidth allowances; Hobby pauses the project when exceeded rather than billing. Function duration: the scan route sets `maxDuration = 120`. Check current numbers at vercel.com/pricing before launch. |
| Neon | Free | Postgres for catalog and user data | 0.5 GB storage per project; monthly compute-hour allowance with autosuspend. Accord's catalog uses **36 MB** (measured locally, 2026-10-30). |
| Modal | Starter, **no payment method** | ScentLens recognizer, deployed from the ScentLens repo | Verified 2026-10-30 on the Usage & Billing page: $1.00 included credit per month, usage limit $1 "set by Modal" until a payment method is added, $0 in charges. |
| GitHub | Free | Source | none |

No paid AI APIs, no paid search, no email provider, no image hosting.

## Modal / ScentLens: the real risk

Measured config (`scent-lens/deploy/modal_app.py`): 4 CPU cores, 4 GiB, `max_containers=1`, `scaledown_window=300` s, 4 concurrent inputs.

Price (modal.com/pricing, 2026-10-30): $0.0000131 per core-second and $0.00000222 per GiB-second, so one warm container costs about **$0.22 per hour**. This workspace's $1 monthly credit covers about **4.5 container-hours**, shared with the public ScentLens demo.

Because the container stays up 5 minutes after the last request, each isolated scan costs up to ~6 minutes of container time (≈ $0.022) including a cold start.

### What Accord controls (implemented)

| Control | Where | Default |
|---|---|---|
| Scanner off unless `SCANNER_MODE=live` and `SCENTLENS_URL` set | `src/lib/scan/service.ts` | off |
| Global daily scan cap, atomic in Postgres | `scan_quota` | 3 / day |
| Per-user daily cap | `scan_quota` | 2 / day |
| Per-guest daily cap (salted, daily-rotated IP hash; raw IP never stored) | `scan_quota` | 1 / day |
| At most 2 concurrent upstream calls, leases expire if a function dies | `scan_slots` | 2 slots, 150 s lease |
| Same photo within 24 h answered from cache, no upstream call | `scan_cache` (hash + result only) | 24 h |
| Server-side image validation by magic bytes and size before any quota or call | `src/lib/scan/image.ts` | ≤ 2 MB |
| Client resizes to ≤ 1024 px JPEG; no automatic retries; one scan in flight per tab | `src/components/scanner.tsx` | |
| No warm-up pings | Not applicable | |

Worst case from Accord's side with defaults: 3 isolated scans/day × ~6 min ≈ 18 container-minutes/day ≈ 9 hours/month. That can exceed the $1 credit late in a month; when it does, Modal stops the app (no charge) and Accord reports the scanner as unavailable until credits renew. Raise the caps only after adding budget.

### What Accord cannot control

The ScentLens demo endpoint (`https://bhnsadhu--scent-lens-web.us-east.modal.run`) is **public and unauthenticated**. Anyone can call it directly, bypassing every limit above. Accord's quotas bound Accord's traffic only.

The protection for that is on Modal's side:

1. **No payment method on the Modal workspace** (verified 2026-10-30): the usage limit is fixed at the $1 credit, so direct abuse of the public endpoint can exhaust the credit (scanning stops until next month) but **cannot create a bill**. If a card is ever added, set a $0 spend limit first.
2. Optional, needs approval: redeploy ScentLens with a shared-secret header on a separate Accord-only endpoint, so the public demo and Accord's traffic are separable. Not done; ScentLens is not modified without permission.

Production currently keeps `SCANNER_MODE` unset (scanner off) pending Bhanu's go-ahead to switch it on; the cost question is resolved.

## Remaining financial risks

- Modal spend limit not yet confirmed (above).
- Vercel Hobby is for non-commercial use; Accord must stay non-commercial.
- Neon compute hours: heavy traffic could exhaust the monthly allowance, which suspends the database (no bill on Free).
- A future dependency or integration could introduce cost; every new external service must be added here first.
