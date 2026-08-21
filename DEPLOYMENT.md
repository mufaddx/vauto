# Deployment

## Rule

Development → Git → Staging → automated tests → manual QA → founder approval → production.

Never deploy local experiments to production. Never share production database credentials with staging.

## Environments

| | Staging | Production |
| --- | --- | --- |
| Site | https://staging.vidlix.in | https://vidlix.in |
| App | same staging host or app-staging host | https://app.vidlix.in |
| Admin | separate admin-staging host | https://admin.vidlix.in |
| Database | `vidlix_staging` | `vidlix_production` |
| Redis | staging instance | production instance |
| Storage | staging bucket | production bucket |
| Meta app | development/test app | production app |
| Razorpay | test keys | live keys |
| Webhooks | staging URLs | production URLs |

## Rollback

Keep the previous stable build available (hosting provider previous deployment / container image tag). Restore the last known-good image if a release fails health checks.

## Checklist before production

See `TESTING.md` and `STAGING` items in `BRAIN.md`. Founder approval is required.
