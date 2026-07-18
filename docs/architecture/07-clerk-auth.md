# FitCore AI — Clerk Authentication Architecture

> Document 07 · Status: DRAFT. Clerk is the **only** auth system. Identity key = `clerkUserId`.
> Exact dashboard settings to be confirmed against current Clerk docs at implementation.

## 1. Providers
Email/password + **Google, GitHub, Apple** OAuth (social connections enabled in Clerk
dashboard). One Clerk instance powers web + future mobile.

## 2. Middleware protection
`middleware.ts` uses `clerkMiddleware` to protect everything except `(marketing)`, `(auth)`,
and public webhooks. Role-gated route groups: `(admin)` requires `role=admin`, `(trainer)`
requires `role in {trainer,admin}` — checked from session claims.

## 3. Session requirements → how Clerk delivers them

| Your requirement | Mechanism |
|---|---|
| Persistent / "stay logged in indefinitely" | Configure session **inactivity timeout = off / very long** and a long **maximum lifetime** in Clerk. Default is a 7-day sliding window — we extend it. |
| Survives browser close / restart / Vercel deploy / cache clear | Session lives in Clerk's cookie + Clerk's servers, independent of our deploys/build cache. |
| Automatic token refresh | Clerk issues a short-lived (~60s) JWT auto-refreshed by the client; the **session** is the long-lived thing, the token rotates silently. |
| Cross-device sessions | Clerk tracks one session per device; user stays logged in on each. |
| Device management page | `<UserProfile>` "Security / Active devices" lists sessions with revoke. |
| Logout all devices | Revoke all sessions via Backend API (`sessions.revoke`) or the UserProfile control. |
| Logout only on manual / password change / admin force | Password change → revoke other sessions; admin → Backend API revoke; otherwise session persists. |
| Secure handling | HttpOnly secure cookies, short-lived JWT, rotation, no tokens in localStorage. |

## 4. Mobile auth (doc 08)
Clerk Expo/React Native SDK; Flutter via Clerk session + **JWT templates**. Native clients
call `getToken()` and send `Authorization: Bearer <jwt>`; REST `/api/v1` accepts it. Same user,
same `clerkUserId`.

## 5. Clerk → Supabase profile sync (webhooks, Svix-signed)
`POST /api/webhooks/clerk`, verify Svix signature, then:
- `user.created` → upsert `clerk_profiles` row (clerkUserId, email, name, role=user), create
  `coach_memory` shell + `notification_prefs`.
- `user.updated` → sync email/name/image.
- `user.deleted` → soft-delete + cleanup per retention policy.
- `session.created` → optional audit log.

## 6. RBAC
Role stored in Clerk **publicMetadata.role** (source of truth for claims) and mirrored to
`users.role`. Middleware + service-layer guards read it; trainer→client access additionally
checks `trainer_clients` (doc 08/09). Default role `user`; trainer/nutritionist set on
admin verification.

## 7. Env
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, OAuth creds in
Clerk dashboard. No passwords ever stored by us.
