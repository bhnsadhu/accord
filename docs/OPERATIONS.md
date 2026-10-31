# Production operations

Accord is a small, free service. Keep the approved interface and truthful catalog coverage. Service limits pause features rather than silently introducing paid infrastructure.

## Accounts and email

Production uses Better Auth with a domain-restricted, sending-only Resend key in Vercel. `AUTH_EMAIL_ENABLED=true`, `AUTH_EMAIL_FROM`, and `RESEND_API_KEY` enable verification and recovery. No secret belongs in source control. Verification links last one hour. Password reset links last 30 minutes, are single-use, and revoke other sessions. All private API reads check the database session, bypassing the signed-cookie cache.

The sender is `Accord <accounts@bhanusadhu.com>`. Delivery was accepted by Resend's `delivered@resend.dev` simulator on October 31, 2026. That proves provider acceptance, not delivery to every inbox. Account flows are tested locally through a private test mailbox. `AUTH_EMAIL_TEST_INBOX` is rejected as a production fallback.

App email budgets: 70 per UTC day, 2,000 per calendar month, three per recipient per hour. These share the provider account's allowance with the owner's other projects. Delivery failures and budget exhaustion appear as structured events in Vercel logs without recipient addresses or links.

## Monitoring

The public repository's `Production availability` workflow checks the homepage, protected database health endpoint, and a known search hourly. It retries once and fails visibly on an outage. `MONITOR_SECRET` exists in Vercel and GitHub Actions. Unauthenticated health requests return 401 without querying the database. Monitoring never warms the scanner.

GitHub scheduled jobs can be delayed. Actions notifications follow the owner's GitHub settings; this is an hourly availability check, not a paging service or uptime SLA. Check both Actions and Vercel runtime logs after deployment. Structured events contain route patterns, event names, kinds and digests, not request bodies, email addresses, photos or tokens. Provider access logs are separate.

## Backup and restore

Private repository: https://github.com/bhnsadhu/accord-ops

Daily at 07:19 UTC, a standard Linux job dumps the public and drizzle schemas from the direct Neon endpoint under a shared repeatable-read snapshot. It encrypts the dump with AES-256-GCM, decrypts it into private temporary storage, restores into a disposable PostgreSQL 18 container, and compares every table's row count plus collection foreign-key integrity. Only the encrypted file is uploaded after verification. Backups expire after seven days and are capped at 20 MiB each. The job is capped at six minutes. Plaintext files and the disposable database are removed afterward.

The first verified restore on October 31, 2026 checked 17 tables and produced a 2,460,765-byte encrypted archive before the additive request-budget migration. Evidence: https://github.com/bhnsadhu/accord-ops/actions/runs/41194500635

After the migration, a second successful run verified all 18 tables and completed retention maintenance: https://github.com/bhnsadhu/accord-ops/actions/runs/41194587552

`BACKUP_DATABASE_URL` and `BACKUP_KEY` are private repository secrets. A recovery copy of the encryption key is in the owner's ignored, mode-0600 `.env.operations.local`. Preserve that key in a password manager before replacing this computer; GitHub secrets cannot be read back. Losing every copy of the key makes backups unrecoverable. This file is never included in deployment or commits.

Restore procedure:

1. Download a successful encrypted artifact from the private repository. Obtain the original `BACKUP_KEY` through the owner's secure secret storage.
2. Set that environment variable and run `node scripts/ops/decrypt.mjs INPUT.backup.enc NEW.dump`. The output must not already exist and is created with mode 0600.
3. Restore into a new disposable PostgreSQL 18 database or a separate Neon recovery branch. Install `pg_trgm` first. The backup script demonstrates filtering the already-created public schema from the archive table of contents. Never point a restore drill at production.
4. Verify row counts, account access, collection ownership, search and the migration journal. During incident recovery, reconcile deletions made after the backup so deleted accounts are not unintentionally reactivated.
5. Only after verification, intentionally switch the production database connection and redeploy. Keep the original database available for rollback. Remove plaintext dumps after use.

`scripts/ops/backup.mjs` and `maintenance.mjs` are mirrored in the private repository. Update both copies together. Its workflow runs maintenance only after successful backup verification and upload.

## Retention

Daily maintenance removes expired sessions and verification tokens, rate-limit rows older than one day, scan counters older than 35 days, scan results older than 24 hours, expired request budgets after one additional day, and catalog requests older than 90 days. Account deletion cascades to profile and collection. Encrypted backups can retain deleted data for up to seven days. Provider logs follow provider settings.

## Scanner

`deploy/scanner.py` deploys the separate `accord-scanner` Modal app using the existing ScentLens runtime image and local model export. It does not modify the original public ScentLens demo. The private endpoint requires a Modal proxy token before compute starts. Vercel holds `MODAL_PROXY_KEY` and `MODAL_PROXY_SECRET`; set `SCENTLENS_PROTOCOL=private` and its private `SCENTLENS_URL`.

The app accepts at most 2 MiB, decodes at most 16 million pixels, runs one input/container at a time, and scales down after 30 idle seconds. Photos stay in request memory. Recognition results and photo fingerprints can be reused for 24 hours. No uploaded-photo training or storage bucket is configured. A live test returned HTTP 200 in 29.9 seconds with an honest abstention; an unauthenticated request returned 401.

Default allowance: three global scans/day, 60/calendar month, two/user/day, one/guest/day. Both successful and failed upstream attempts count. Duplicate photos may use cached results without another compute call. Shared Modal credit can still be exhausted by the separate public demo; search continues when scanning is unavailable. No payment method or paid upgrade was added.

## Deploy and rollback

Run lint, typecheck, unit/integration tests, browser journeys and production build. Apply additive migrations before deployment, after a verified backup. Push main to trigger Vercel. Check health, search, account recovery pages, headers and scanner status on the live domain. Never load-test live scan inference.

For an application regression, roll Vercel back to the previous ready deployment. The request-budget migration is additive and may remain. For email incidents, inspect Resend and Vercel delivery events; disabling email verification also reopens unverified signup, so prefer fixing delivery or temporarily disabling signup instead of silently relaxing verification.
