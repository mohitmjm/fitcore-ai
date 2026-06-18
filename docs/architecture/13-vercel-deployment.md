# FitCore AI — Vercel Deployment Plan

> Document 13 · Status: DRAFT.

## 1. Environments
GitHub → Vercel. **Preview** deploy per PR (isolated env), **Production** on main. Separate
MongoDB Atlas DBs + Clerk instances + provider keys per environment.

## 2. Runtime
Node.js runtime for routes using the Mongo driver (not Edge — driver needs Node). Edge only for
light, DB-free middleware/redirects. App Router + Server Actions (Next 16.x installed — read
`node_modules/next/dist/docs/` before coding per AGENTS.md).

## 3. Cron (vercel.json)
```json
{ "crons": [
  { "path": "/api/jobs/reflection",   "schedule": "0 19 * * *" },
  { "path": "/api/jobs/today",        "schedule": "30 0 * * *" },
  { "path": "/api/jobs/weekly-story", "schedule": "0 3 * * 1" },
  { "path": "/api/jobs/nudges",       "schedule": "*/15 * * * *" }
] }
```
At scale, move heavy jobs to a queue (Upstash QStash) triggered by cron.

## 4. Atlas
Region near users (**ap-south-1 / Mumbai** for India). Cached client + bounded pool (doc 03 §2).
Network: Vercel egress IPs allowlisted or private endpoint. Backups + PITR enabled.

## 5. Storage / CDN
Cloudinary for images (transforms + CDN) via signed uploads. Vercel CDN for static + ISR for
marketing/blog (SEO). Catalog reads edge-cached.

## 6. Env vars (set in Vercel)
Clerk (`*_CLERK_*`, `CLERK_WEBHOOK_SECRET`), `MONGODB_URI`, AI (`OPENAI_/ANTHROPIC_/GEMINI_` keys),
`CLOUDINARY_*`, `RAZORPAY_*`, `STRIPE_*`, WhatsApp (`WHATSAPP_*`), `UPSTASH_REDIS_*`, `RESEND_API_KEY`,
`FEATURE_WHATSAPP`. Secrets never in client bundle.

## 7. Webhooks (register provider → Vercel URL)
`/api/webhooks/clerk|razorpay|stripe|whatsapp`. Each signature-verified + idempotent (doc 09).

## 8. Observability & security
Sentry (errors), Vercel Analytics/logs, uptime checks. Security headers + HSTS via middleware.
Rate limiting via Upstash (doc 09).

## 9. CI/CD
PR checks: typecheck, lint, unit tests (services/policy), contract tests vs OpenAPI. Preview
deploy for review. Promote to prod on merge. Instant rollback via Vercel deployments.

## 10. Scale knobs
Function regions near Atlas, ISR for content, edge cache for catalogs, queue for jobs, Atlas
autoscaling + sharding (doc 03 §8) when load requires.
```
