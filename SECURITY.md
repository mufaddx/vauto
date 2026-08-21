# Security

- HTTPS in staging and production
- HttpOnly, SameSite=Lax session cookies
- Password hashing (bcrypt)
- Signed session JWTs
- Webhook signature verification (Meta and Razorpay)
- Idempotent webhook processing
- Environment-separated secrets
- No secrets in frontend bundles or Git
- Security headers in middleware
- RBAC via `UserRole` (`USER`, `ADMIN`, `SUPPORT`)
- Admin UI must never display access tokens
- Rate limits belong at the API gateway and in application code per user/workspace/channel
- Input validation with Zod on trusted boundaries

Report issues through the published support email after it is confirmed.
