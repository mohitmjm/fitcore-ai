# FitCore AI — Mobile App Architecture

> Document 08 · Status: DRAFT. Mobile is **enabled now, built later**. The backend must not
> assume a browser.

## 1. Reuse model
Web, mobile, and WhatsApp share the **same** `/api/v1` REST API + service layer (doc 04).
Mobile is a thin client over the same contract — no business logic on device beyond UX/cache.

## 2. Auth
Clerk Expo/React Native SDK (recommended path) or Flutter via Clerk + JWT templates. Client
gets a Clerk session, calls `getToken()`, sends `Authorization: Bearer`. Sessions are
long-lived per doc 07 (no repeated logins).

## 3. Shared business logic
Logic lives in `lib/services` (pure TS). For React Native we can later extract services into a
shared TS package (`packages/core`) consumed by web + RN; Flutter consumes via REST only (no TS
reuse). The API contract is the universal interface.

## 4. Offline-first
- **Delta sync:** `GET /api/v1/sync?since=` reconciles after reconnect.
- **Outbound queue:** logs created offline are queued with **idempotency keys** and flushed on
  reconnect (safe re-send).
- **Local cache:** today card, plan, catalogs cached on device.

## 5. Media & push
- Photos: signed direct-to-Cloudinary upload; client sends resulting URL (same as web).
- Push: Notification adapter targets **FCM/APNs** on mobile (web push on web) via one `notify()`.

## 6. Contract & codegen
OpenAPI 3.1 generated from Zod (doc 04) → typed clients for RN/Flutter; stable `error.code`
enums for localization. Versioned API protects shipped apps from breaking changes.

## 7. WhatsApp complements mobile
Many users will live in WhatsApp (doc 06) even without installing an app — same backend, so
they're first-class without a download.

## 8. Recommended sequencing
Web MVP (Phases 0–2) → harden API/OpenAPI → **React Native/Expo** app (max code reuse) →
Flutter only if a specific need arises. Apple HealthKit sync requires the native app (no web API).
