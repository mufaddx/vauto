# Payments

Phase 1 uses Razorpay Standard Checkout and Razorpay Subscriptions.

## Rules

- Create orders on the server.
- Verify payment signatures on the server.
- Activate subscriptions from verified webhooks, not from the browser redirect alone.
- Test keys on staging. Live keys on production.

## Plans

- Starter Monthly
- Starter Yearly
- Future Pro Monthly — Coming Soon
- Future Pro Yearly — Coming Soon

## Pages

`/pricing`, `/checkout`, `/payment/success`, `/payment/failed`, `/payment/cancelled`, `/app/billing`, `/app/invoices`

Webhook: `/api/webhooks/razorpay`
