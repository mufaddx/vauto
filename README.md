# VIDLIX

Professional SaaS for Instagram and Facebook automation.

**Automate. Engage. Convert.**

Founded by MD Mursalim.

## Phase 1

Instagram + Facebook only. No AI, WhatsApp, or YouTube in this phase.

## Apps

| Surface | Production | Local |
| --- | --- | --- |
| Marketing | https://vidlix.in | http://localhost:3000 |
| Application | https://app.vidlix.in | http://localhost:3000/app |
| Admin | https://admin.vidlix.in | http://localhost:3000/admin |
| Staging | https://staging.vidlix.in | separate env + database |

## Quick start

```bash
cp .env.example .env.local
npm install
npx prisma generate
npm test
npm run dev
```

PostgreSQL and Redis are required for webhooks, queues, and persisted accounts. The marketing site and product UI run without them; health reports `database: false` until `DATABASE_URL` is set.

Never put production secrets in Git. Never point staging at the production database.

## Scripts

- `npm run dev` — Next.js
- `npm test` — keyword and response engine tests
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run worker` — BullMQ workers (needs Redis)
- `npm run build` — production build

See `ARCHITECTURE.md`, `DEPLOYMENT.md`, `ENVIRONMENT.md`, and `BRAIN.md`.
