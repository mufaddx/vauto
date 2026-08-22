# BRAIN.md

Project memory for VIDLIX. Do not paste large source files here.

## Product

- Name: VIDLIX
- Domain: vidlix.in
- Founder: MD Mursalim
- Phase: 1 — Instagram + Facebook
- Positioning: Automate. Engage. Convert.

## Important decisions

- Next.js App Router + TypeScript + Tailwind v4 + Prisma + PostgreSQL + Redis/BullMQ
- Light theme default, with dark and system
- Rule-based `ResponseEngine` now; `AIResponseEngine` later
- Official Meta APIs only
- Razorpay for billing
- Staging is a full copy of the product with isolated data and secrets
- Legal entity details are placeholders until verified
- No fake customers, logos, AI features, or WhatsApp in the Phase 1 UI

## Implemented in this codebase

- Design tokens and shared UI
- Marketing landing, pricing, legal, contact, help, docs, status
- Auth pages and session cookies
- Onboarding
- App dashboard shell and Phase 1 screens (campaigns, automation builder with test-before-activate, inbox, contacts, templates, analytics, channels, business information, billing)
- Admin metrics shell
- Keyword + multi-intent engine with tests
- Webhook routes with verification, payload storage, and idempotency
- Session guards on `/app`, `/admin`, `/onboarding` (middleware + server layouts)
- Workspace + membership creation on signup and first OAuth login
- Meta channel connect/disconnect with AES-256-GCM encrypted page tokens
- Razorpay order creation, checkout widget, signature verification, webhook-driven subscription and invoice updates
- Password reset with hashed single-use tokens and a pluggable mailer
- Email code (OTP) sign-in and sign-up through Resend; passwords remain available but optional
- Redis-backed rate limiting with an in-memory fallback
- Worker that runs comments through the response engine and sends replies
- Full CRUD via server actions for campaigns, campaign posts, automations, keyword rules, templates, contacts, tags, conversations, business information, profile, and password
- Automation test-before-activate enforced server-side (`lastTestedAt` gates activation; editing clears it)
- Overview, analytics, billing, invoices, inbox, contacts and admin all read live workspace data

## Not live until environment credentials exist

The code paths are written; each one is gated on its variable and reports its
state at `/api/health`.

- Meta OAuth + replies — needs `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `ENCRYPTION_KEY`
- Webhook processing — needs `REDIS_URL` and the worker process running
- Razorpay — needs `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Password reset email — needs `RESEND_API_KEY` and `MAIL_FROM`
- Object storage uploads — no code yet

## Future (do not implement in Phase 1)

WhatsApp, YouTube, AI agent/memory/replies/intent/ticketing, human handoff AI, AI subscription, advanced CRM, bulk messaging.

## Data access

Screens use server actions in `src/lib/actions/*`, not REST routes. Every query
and mutation is scoped by `workspaceId` resolved from the session through
`requireWorkspace()` / `tryWorkspace()` in `src/lib/workspace-context.ts`, so a
workspace can never read or write another's rows. `tryWorkspace()` returns null
when no database is configured and the page renders `ConfigNotice`.

Demo data has been removed. Empty screens now show real empty states.

## Database

See `prisma/schema.prisma`. Migration history lives in `prisma/migrations`:
`00000000000000_init` is a baseline of the already-applied schema — run
`prisma migrate resolve --applied 00000000000000_init` once against an existing
database before `prisma migrate deploy`. Applied on Supabase project `egflpmfnnulatrmciqmm` (public tables + RLS enabled; Data API grants revoked so the Next.js server via Prisma is the access path). Runtime uses `@prisma/adapter-pg` with `DATABASE_URL` (pooler 6543). `DIRECT_URL` is for migrations. `/api/health` reports `database: true` only after a live `SELECT 1`.

## Environment and deploy

Separate staging and production for database, Redis, storage, Meta, Razorpay, logs, and webhooks. Production only after staging QA and founder approval.

Empty-string environment variables are the recurring failure here. `??` and zod
`.default()` only catch `undefined`, so a variable set to `""` in the hosting
dashboard flows straight through. `envValue()` in `src/lib/env.ts` treats blank
as unset — use it for anything that ends up inside a URL. This bug produced a
relative OAuth `redirect_uri` (Meta "Can't load URL", Google `invalid_request`)
and `facebook.com//dialog/oauth` from an empty `META_GRAPH_VERSION`.
`assertAbsoluteOrigin()` now refuses to build a relative redirect URI at all.

Vercel: GitHub `mufaddx/vauto`. Cloudflare Workers / OpenNext config has been
removed — Vercel is the only host. The BullMQ worker (`npm run worker`) is a
long-running process and must run somewhere that is not Vercel functions.
Empty `MARKETING_URL` is invalid (`??` does not skip `""`); metadata base falls back to `VERCEL_URL` or `https://vidlix.in`. Cloudflare Workers was over the free 3 MiB limit — Vercel is the app host. OAuth callback URLs are derived from the request origin (`https://vidlix.in/.../callback`). Prisma runtime prefers `DIRECT_URL` (session pooler) then `DATABASE_URL`.

## Meta app types

Facebook *login* and Facebook *channel connect* need different Meta app types.
A business-type app cannot request `email` / `public_profile` — it fails with
"Invalid Scopes: email" — but it is the right type for the `pages_*` and
`instagram_business_*` scopes used by channel connect. Keep login on a
consumer-type app via `FACEBOOK_LOGIN_APP_ID` / `FACEBOOK_LOGIN_APP_SECRET`,
or drop Facebook login and keep Google plus email.

## Known limitations

- Admin console is read-only: real metrics, but no user/workspace management screens yet
- No manual outbound sending from the inbox; replies come from automations only
- Campaign posts are linked by pasting a media/post id — there is no Meta post picker yet
- `prisma` CLI has a known high-severity advisory in `deepmerge-ts`; the fix is a breaking downgrade to Prisma 6, so it is accepted for now (build-time only)
- Meta permission names must be confirmed in the Meta app dashboard against current docs
- Legal pages must be reviewed by an Indian lawyer/company professional before launch
- Rate limiting at the edge still needs the production gateway configuration
