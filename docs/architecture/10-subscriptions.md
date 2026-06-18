# FitCore AI — Subscription Architecture

> Document 10 · Status: DRAFT. Monetization is downstream of love (vision). Razorpay (India) +
> Stripe (global).

## 1. Plans & gating
| | Free | Premium | Pro |
|---|---|---|---|
| Logging (photo/voice/text), basic plan | ✓ | ✓ | ✓ |
| Adaptive Living Plan + Coach Memory + daily Today | limited | ✓ | ✓ |
| WhatsApp coaching, Weekly Story, Health Timeline, advanced analytics | — | ✓ | ✓ |
| Human trainer access (hybrid §5.15), priority support | — | — | ✓ |

Entitlements checked in the service layer via `ctx.plan` (`requirePlan(ctx,'premium')`). The
`users.subscription` field mirrors the source-of-truth `subscriptions` collection.

## 2. Providers (adapter pattern)
`PaymentProvider` interface (doc 04 §6) with Razorpay + Stripe implementations. Choose by user
region/currency (INR → Razorpay default). Swappable without touching billing logic.

## 3. Flow
Checkout (hosted/provider SDK) → provider creates subscription → **webhook** (`/api/webhooks/{razorpay,stripe}`)
verified + deduped → **multi-doc transaction** writes `payments` + `subscriptions` + mirrors
`users.subscription`. Never trust client-reported payment status — webhooks are the truth.

## 4. Lifecycle
Trials, renewals, payment failure → grace period + dunning emails (Resend), cancel (access to
period end), upgrade/downgrade with proration, refunds. All state transitions are webhook-driven
and idempotent.

## 5. Growth levers (doc tie-ins)
- **Coupons** (`coupons`): percent/flat, expiry, usage caps.
- **Referrals** (`referrals`): "gift a week of Premium" — both sides rewarded in a transaction.
- **Affiliates**: tracked codes + payout ledger.

## 6. Money rules
Store amounts in **minor units** (paise/cents) as integers; record currency; full audit trail
in `payments` + `audit_logs`. Reconciliation job vs provider dashboards.

## 7. Env
`RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`, `STRIPE_SECRET_KEY/WEBHOOK_SECRET`, price/plan IDs.
