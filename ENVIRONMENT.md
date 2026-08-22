# Environment

Copy `.env.example` for development, `.env.staging.example` for staging, and `.env.production.example` for production.

Do not commit `.env`, `.env.local`, `.env.staging`, or `.env.production`.

## Required for the app to start

| Variable | Why |
| --- | --- |
| `DATABASE_URL` | Postgres pooler URL (Supabase `:6543`). Used for migrations and as a runtime fallback. |
| `DIRECT_URL` | Session-mode pooler (`:5432`). Preferred at runtime by the Prisma pg adapter. |
| `DATABASE_CA_CERT` | The provider's CA certificate, so the database TLS chain is verified. Supabase: Project Settings → Database → SSL Configuration. Without it the app refuses to connect unless `DATABASE_TLS_INSECURE=true`. |
| `SESSION_SECRET` | 32+ characters. **There is no fallback** — sessions throw without it. |

`/api/health` returns `503` and lists `missingRequired` when either is absent.

## Database TLS

Managed providers terminate TLS with their own CA, which is not in Node's trust
store — the symptom is `self-signed certificate in certificate chain`.

| Setting | Result |
| --- | --- |
| `DATABASE_CA_CERT` set | Chain verified. This is the correct production setting. |
| `DATABASE_TLS_INSECURE=true` | Connects and encrypts, but does **not** verify the certificate. Anyone able to intercept the connection can present their own. Development and unblocking only. |
| Neither | The app refuses to create a database client and says so. |

`/api/health` reports the active mode as `databaseTls`.

## Required per feature

| Variable | Unlocks |
| --- | --- |
| `REDIS_URL` | BullMQ queues, the worker, and shared rate limiting. Without it webhooks are stored but never processed. |
| `ENCRYPTION_KEY` | AES-256-GCM at-rest encryption for Meta page tokens. Channel connect refuses to run without it. 32 bytes, hex or base64. |
| `META_APP_ID` / `META_APP_SECRET` | Instagram + Facebook channel connect, webhook signature verification, sending replies. |
| `META_WEBHOOK_VERIFY_TOKEN` | Meta's webhook subscription handshake (`GET /api/webhooks/meta`). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server-side order creation and checkout signature verification. |
| `RAZORPAY_WEBHOOK_SECRET` | Subscription and invoice updates from `POST /api/webhooks/razorpay`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google login button. |
| `FACEBOOK_LOGIN_APP_ID` / `FACEBOOK_LOGIN_APP_SECRET` | Facebook login button (falls back to the `META_*` pair). |
| `RESEND_API_KEY` / `MAIL_FROM` | Password reset emails. Without them the reset link is only written to the server log. |
| `WORKER_CONCURRENCY` | Webhook worker parallelism. Defaults to 5. |
| Storage credentials | S3-compatible object storage (not yet wired to any feature). |

Generate an encryption key:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Callback URLs to register

| Provider | URL |
| --- | --- |
| Google OAuth | `https://vidlix.in/api/auth/oauth/google/callback` |
| Facebook Login | `https://vidlix.in/api/auth/oauth/facebook/callback` |
| Meta channel connect | `https://vidlix.in/api/channels/callback` |
| Meta webhook | `https://vidlix.in/api/webhooks/meta` |
| Razorpay webhook | `https://vidlix.in/api/webhooks/razorpay` |

Use the matching staging host for the staging Meta and Razorpay apps.

## Legal placeholders

`PUBLIC_LEGAL_ENTITY`, `PUBLIC_GSTIN`, `PUBLIC_CIN`, `PUBLIC_GRIEVANCE_OFFICER`, and related fields stay empty until verified. The UI shows placeholders instead of invented facts.
