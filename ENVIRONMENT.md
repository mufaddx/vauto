# Environment

Copy `.env.example` for development, `.env.staging.example` for staging, and `.env.production.example` for production.

Do not commit `.env`, `.env.local`, `.env.staging`, or `.env.production`.

## Required per environment

- `DATABASE_URL` — PostgreSQL, unique per environment
- `REDIS_URL` — Redis, unique per environment
- `SESSION_SECRET` — 32+ characters, unique per environment
- `META_APP_ID` / `META_APP_SECRET` / `META_WEBHOOK_VERIFY_TOKEN`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
- Storage credentials for S3-compatible object storage

## Legal placeholders

`PUBLIC_LEGAL_ENTITY`, `PUBLIC_GSTIN`, `PUBLIC_CIN`, `PUBLIC_GRIEVANCE_OFFICER`, and related fields stay empty until verified. The UI shows placeholders instead of invented facts.
