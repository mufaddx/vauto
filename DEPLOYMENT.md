# Deployment

## Shape of the system

| Piece | Where it runs |
| --- | --- |
| Next.js app (`vidlix.in`) | Hostinger, Node app deployed from GitHub |
| Database | Supabase Postgres, reached over TCP by Prisma |
| Queues + worker | Redis, plus a second long-running Node process |
| Email | Resend |

The app talks to Supabase through Prisma and the `pg` driver, **not** through
`@supabase/supabase-js`. The Supabase Data API is deliberately revoked, so any
guide that tells you to add `@supabase/supabase-js` and a `db.js` does not
apply here — it would install an unused dependency and inject the wrong
environment variables.

## Hostinger settings

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Branch | `main` |
| Node version | 22.x (matches `engines` in `package.json`) |
| Root directory | `./` |
| Build command | `npm run build` (runs `prisma generate` then `next build`) |
| Start command | `npm start` |

Environment variables are **not** optional — see `ENVIRONMENT.md`. With none
set, the site builds and serves, but `/api/health` reports
`database: false` and every account action fails.

## Database migrations

Migrations are not run by the build. Run them yourself against Supabase after
merging schema changes, with `DATABASE_URL` and `DIRECT_URL` set locally:

```
npx prisma migrate deploy
```

The first time only, tell Prisma the baseline is already applied — the schema
was created on Supabase before migration history existed:

```
npx prisma migrate resolve --applied 00000000000000_init
npx prisma migrate deploy
```

## The worker

`npm start` serves the site. It does **not** process webhooks. Meta events are
stored and queued, but nothing replies until the worker is also running:

```
npm run worker
```

This is a long-running process and needs `REDIS_URL` and the same database
variables as the app. Run it as a second Node application on Hostinger, or on
any host that keeps a process alive. Without it, `/api/webhooks/meta` keeps
recording events with `status: QUEUED` and no automation ever fires.

## DNS

`vidlix.in` must point at exactly one host. Pointing it at two, or leaving old
records behind, produces confusing results: requests land on whichever host DNS
resolves to, so a correct deployment on the other one appears to have no
effect.

## Checking a deployment

`/api/health` reports what this environment can actually do:

```
{
  "ok": true,
  "env": "production",
  "database": true,
  "databaseTls": "verified",
  "redis": true,
  "integrations": { ... },
  "missingRequired": [],
  "pendingOptional": []
}
```

`missingRequired` must be empty. `pendingOptional` lists integrations whose
credentials are not set yet — those features stay switched off rather than
failing at runtime.

## Rule

Development → Git → staging → automated tests → manual QA → founder approval →
production. Never deploy local experiments to production, and never share
production database credentials with staging.

## Rollback

Redeploy the previous commit from GitHub. Keep the last known-good commit
identified before shipping a release.
