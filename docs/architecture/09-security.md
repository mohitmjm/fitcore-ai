# FitCore AI — Security Design

> Document 09 · Status: DRAFT. Trust is a moat (vision §5.10) — security is a feature.

## 1. RBAC
Roles (`user|trainer|nutritionist|admin`) in Clerk publicMetadata + mirrored to `users.role`.
Enforced at three layers: middleware (route groups), service guards (`requireRole(ctx, …)`),
and **relationship checks** (trainer→client reads require an active `trainer_clients` row).
Admin actions run a separate, audited path.

## 2. Authorization without RLS (the #1 risk)
MongoDB has no row-level security. **Every** user-owned query goes through owner-scoped repos
that force `{ clerkUserId }` into the filter (doc 03 §4). Direct collection access outside
repos is blocked in review + lint. This is the most important control in the system.

## 3. API rate limiting
Upstash Redis sliding-window limits per `clerkUserId` + IP + route class. Tight limits on
auth, AI (cost!), WhatsApp inbound, and uploads. Return `429` with `Retry-After`.

## 4. Input validation
Zod at every service boundary + Mongo `$jsonSchema` validators (defense in depth). Reject
unknown fields. Treat all external input (REST, webhooks, WhatsApp, AI output) as untrusted.

## 5. CSRF & transport
REST uses `Authorization: Bearer` (not ambient cookies) → CSRF surface minimal; Server Actions
use Clerk's same-site secure cookies. HTTPS only; HSTS; secure headers (CSP, X-Frame-Options,
etc.) via middleware.

## 6. Webhook signature verification
Verify **every** webhook before trusting: Clerk/Svix, Razorpay, Stripe, Meta WhatsApp
(`X-Hub-Signature-256`). Dedupe by provider event id (idempotent).

## 7. Secure MongoDB access
Least-privilege Atlas DB users, network allowlist / private endpoint, encryption in transit +
at rest, no admin creds in app, secrets only in env (never client/bundle). Backups + PITR.

## 8. Audit logs
`audit_logs` (append-only): auth events, role changes, admin actions, payments, data
export/delete, memory edits. Indexed `{ clerkUserId, at }`, `{ action, at }`. Retained per policy.

## 9. Data privacy (health data is sensitive)
DPDP/GDPR-minded: consent, export, delete; PII minimized in signals/logs; phone numbers
referenced by key; Coach Memory user-visible/editable (doc 02 §9). No third-party data sale;
aggregate ML uses de-identified data.

## 10. Content safety
Eating-disorder / body-image guardrails and health humility (vision §8) enforced in coach
prompts + a moderation/review queue in admin. AI output validated before persisting as facts.

## 11. Supply chain & ops
Pinned dependencies, Dependabot, secret scanning, Sentry for errors, principle-of-least-
privilege CI. OWASP Top 10 reviewed per release.
