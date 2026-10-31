# Costs

Goal: $0 additional spend for personal, non-commercial use within free tiers. No paid plan, card, add-on or paid AI API was added. Account allowances are shared with the owner's other projects, so capacity is limited.

| Service | Configuration | Boundary |
|---|---|---|
| Vercel | Existing Hobby project | Non-commercial use; free function/bandwidth limits apply. Scanner request duration is capped at 120 seconds. |
| Neon | Existing Free project | Catalog and accounts use PostgreSQL. Scale-to-zero and free compute/storage allowances apply. |
| Resend | Existing verified domain, sending-only key | Accord caps at 70 emails/day and 2,000/month, below Free's 100/day and 3,000/month. Other applications share provider quotas. No upgrade or overages enabled by this work. |
| Modal | Existing Starter workspace, no payment method | Last billing verification October 30, 2026: $1 included credit and a fixed $1 usage limit. This account-specific limit is lower than the publicly advertised credit. Exhaustion stops scanning. |
| GitHub | Public CI/monitor, private backups | Standard public runners are free. Daily private backup job has a six-minute timeout: at most 186 scheduled minutes/month. Up to seven artifacts of 20 MiB each. Both are within Free's allowance by themselves, but other private repositories share it. |

## Scanner budget

Accord's authenticated endpoint uses four CPU cores, four GiB RAM, one container and 30 seconds of idle time. Current listed CPU/memory rates total approximately $0.00006128 per container-second. A 30-second observed cold scan plus 30 idle seconds is about $0.0037. Startup and recognition time vary, so this is an observation, not a guaranteed price.

The database enforces three scans/day and 60/calendar month globally, two/day per account and one/day per guest. Every actual attempt counts, including upstream failures. Image size, concurrency and request duration are bounded. Cached results last 24 hours. Unauthenticated calls are rejected by Modal before compute starts.

The separate public ScentLens demo remains on the same workspace. Its direct traffic can consume shared credits and interrupt Accord scanning. An isolated endpoint prevents bypassing Accord's private API but does not isolate the account's credit balance. No card was added; do not add one without first configuring a hard spending boundary.

## Operational bounds

Backups are encrypted and restore-tested before upload. Seven-day artifact retention and the 20 MiB per-file ceiling keep this repository's artifacts below 140 MiB. A failed backup is not uploaded. Private Actions minutes and artifact storage are shared; stop scheduled jobs if the account's free allowance becomes unavailable. Hourly monitoring performs no scanner inference.

Email sends stop at Accord's caps and provider limits. Bulk marketing, contact imports and paid delivery features are not configured. Resend overages were not enabled. Vercel Hobby remains unsuitable for a commercial product without reviewing its terms and costs.

Sources checked October 31, 2026: [Modal pricing](https://modal.com/pricing), [proxy authentication](https://modal.com/docs/guide/webhook-proxy-auth), [Resend pricing](https://resend.com/pricing), [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Recovery procedures and verified evidence are in [OPERATIONS.md](docs/OPERATIONS.md).
