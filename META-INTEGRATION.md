# Meta integration

VIDLIX uses official Meta Graph APIs only.

## Principles

- OAuth / login. No Instagram or Facebook passwords.
- Professional Instagram accounts where Meta requires them.
- Facebook Pages via official Page connection.
- Webhooks with `X-Hub-Signature-256` verification.
- Idempotent event IDs.
- Respect comment private-reply limits and Messenger messaging windows.
- No scraping, cookies, browser automation, or unofficial APIs.

## Intended permissions (confirm in the Meta app dashboard)

Instagram (as documented for professional accounts):

- `instagram_business_basic`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`

Facebook Page / Messenger capabilities are requested only as Meta documents them for the app.

## Endpoints in this repo

- OAuth helper: `src/lib/meta/client.ts`
- Webhook: `POST/GET /api/webhooks/meta`

Do not invent API behaviour. If Meta’s docs change, update this file and the client together.
