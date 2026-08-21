# Architecture

VIDLIX is a Next.js App Router monolith with a modular domain layer so WhatsApp, YouTube, and AI can be added later without rebuilding the core.

## Surfaces

- Marketing routes in `src/app/(marketing)`
- Auth routes in `src/app/(auth)`
- Application in `src/app/app`
- Admin in `src/app/admin`
- Host rewrites in `src/middleware.ts` (`app.*` → `/app`, `admin.*` → `/admin`)

## Layers

1. UI (App Router + design tokens + shared components)
2. API routes (`src/app/api`)
3. Domain engines (`src/lib/engines`) — keyword matching and `ResponseEngine`
4. Integrations (`src/lib/meta`, `src/lib/payments`)
5. Persistence (Prisma / PostgreSQL)
6. Queue (Redis + BullMQ in `src/lib/queues` and `workers/`)

## Response engine

`RuleBasedResponseEngine` implements `ResponseEngine`.

`AIResponseEngine` exists only as a Phase 2 plug-in point and throws if used.

Priority for facts:

1. Post / reel specific
2. Campaign
3. Global business information (only if activated)

## Webhooks

Meta → `/api/webhooks/meta` → signature check → idempotency (`eventId`) → queue → worker → rule engine → action → logs.

Razorpay → `/api/webhooks/razorpay` → signature check → subscription state.

## Non-goals (Phase 1)

LLM APIs, embeddings, WhatsApp, YouTube, unofficial scraping, Instagram/Facebook password collection.
