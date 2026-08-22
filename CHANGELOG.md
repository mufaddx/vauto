# Changelog

## Unreleased

### Fixed
- Database TLS failed against the Supabase pooler with "self-signed certificate in certificate chain". TLS is now configured explicitly on the pool. Verification is the default: `DATABASE_CA_CERT` verifies the chain, and skipping verification requires an explicit `DATABASE_TLS_INSECURE=true` opt-in that logs a warning. Without either, the app refuses to connect
- The OAuth callback put raw Prisma errors into the redirect URL, exposing internal detail in the address bar and page. Errors are logged and reduced to a coded hint
- Facebook login scopes are configurable via `FACEBOOK_LOGIN_SCOPES`; business-type Meta apps cannot request `email` or `public_profile`
- OAuth `redirect_uri` was emitted as a relative path when `APP_URL` was an empty string, which Meta rejects with "Can't load URL" and Google with `invalid_request`. Blank environment variables are now treated as unset, and building a relative redirect URI throws instead
- An empty `META_GRAPH_VERSION` produced `facebook.com//dialog/oauth` and `graph.facebook.com//...`; it now falls back to `v21.0`

### Security
- `/app`, `/admin` and `/onboarding` now require a session; `/admin` also requires the `ADMIN` role
- `SESSION_SECRET` no longer falls back to a hardcoded development value
- Login and signup no longer issue sessions when the database is unreachable outside development
- Added logout, open-redirect-safe `next` handling, and rate limiting on auth routes
- Meta webhook verify token is now compared in constant time

### Added
- CRUD for campaigns, campaign posts, automations, keyword rules, templates, contacts, tags, conversations, business information, and account settings, all through workspace-scoped server actions
- Automation test-before-activate is now enforced on the server
- Onboarding answers are persisted instead of being discarded
- Overview, analytics, billing, invoices, inbox and admin read live data; demo data removed
- Meta channel connect/disconnect with encrypted page access tokens
- Razorpay order creation, checkout widget, and webhook-driven subscription/invoice updates
- Password reset with hashed single-use tokens and a Resend-backed mailer
- Workspace and membership creation on signup and first OAuth login
- Worker pipeline that turns Meta comment webhooks into automated replies
- Prisma migration history (baseline + two migrations)
- Expanded `/api/health` integration report

### Changed
- Rate limiting is Redis-backed with an in-memory fallback
- Cloudflare Workers / OpenNext build path removed; Vercel is the only host

## 0.1.0 — 2026-08-22

- Initial Phase 1 architecture for VIDLIX
- Design tokens, marketing site, auth, app shell, admin shell
- Rule-based response engine and keyword matcher
- Meta and Razorpay webhook stubs with signature verification
- Staging/production environment templates and documentation
