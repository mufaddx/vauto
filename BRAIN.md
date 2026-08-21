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
- Webhook routes with verification and idempotency hooks
- Worker entrypoint

## Not live until environment credentials exist

- Real Meta OAuth token exchange
- Sending private replies / Messenger messages
- Razorpay order creation against live/test merchants
- Email delivery for password reset
- Object storage uploads

## Future (do not implement in Phase 1)

WhatsApp, YouTube, AI agent/memory/replies/intent/ticketing, human handoff AI, AI subscription, advanced CRM, bulk messaging.

## Database

See `prisma/schema.prisma`. Applied on Supabase project `egflpmfnnulatrmciqmm` (public tables + RLS enabled; Data API grants revoked so the Next.js server via Prisma is the access path). App still needs `DATABASE_URL` / `DIRECT_URL` in `.env.local` (database password from the Supabase dashboard).

## Environment and deploy

Separate staging and production for database, Redis, storage, Meta, Razorpay, logs, and webhooks. Production only after staging QA and founder approval.

## Known limitations

- UI uses labelled demo data when the database is empty
- Meta permission names must be confirmed in the Meta app dashboard against current docs
- Legal pages must be reviewed by an Indian lawyer/company professional before launch
- Rate limiting at the edge still needs the production gateway configuration
