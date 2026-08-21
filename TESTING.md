# Testing

```bash
npm test
npm run lint
npm run typecheck
```

## Engine coverage

`src/lib/engines/keywords.test.ts` covers alias matching, multi-intent comments, spelling variation, campaign-over-global priority, and inactive global business information.

## Staging QA (manual)

Signup, login, password reset, Meta connection, Instagram, Facebook, webhook verification, comment event, keyword, alias, spelling variation, any-comment, specific reel, campaign-specific reply, global reply, multi-intent, duplicate event, failed API, retry, rate limit, disconnect, billing, Razorpay success/failure, payment webhook, cancellation, mobile, desktop, dark/light, accessibility.

Browsers: Chrome, Safari, Firefox, Android, iOS, desktop, tablet. Also slow network, empty states, long names, multiple campaigns.
