# FitCore AI — Service Layer & Mobile-Ready API Architecture

> Document 04 of the architecture set · Status: DRAFT FOR APPROVAL
> Governed by `vision-and-north-star.md`. Covers your "API Architecture (API-first, versioned,
> service layer)" + "mobile-ready API" deliverables.

---

## 1. The cardinal rule

> **Route handlers and Server Actions contain no business logic.** They authenticate,
> validate input, call a service, and shape the response. All logic lives in the
> framework-agnostic **service layer**.

This is what makes the same backend power web, Android, iOS, React Native, Flutter, and
WhatsApp without rewrites. If logic leaks into a Next.js handler, mobile and WhatsApp can't
reuse it — that's a bug.

```
┌───────────────────────────────────────────────────────────────────┐
│ ENTRYPOINTS (thin, framework-specific)                              │
│  Web Server Actions │ REST /api/v1/* │ WhatsApp webhook │ Cron jobs │
└───────────────┬─────────────┬─────────────────┬──────────────┬─────┘
                │             │                 │              │
                ▼             ▼                 ▼              ▼
┌───────────────────────────────────────────────────────────────────┐
│ SERVICE LAYER  lib/services/*   (pure business logic, no req/res)   │
│  workout · nutrition · progress · coach · memory · gamification ·   │
│  comeback · today · story · social · marketplace · billing ·        │
│  notification · whatsapp · family                                   │
│        ├─ uses POLICY fns (deterministic decisions)                 │
│        └─ emits DOMAIN EVENTS (→ memory signals, jobs)              │
└───────────────┬───────────────────────────┬───────────────────────┘
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────────┐
│ REPOSITORIES (data access)│   │ INTEGRATION ADAPTERS (interfaces)  │
│ Mongo, scoped by user     │   │ ai · payments · storage · wa · push│
└───────────────────────────┘   └───────────────────────────────────┘
```

---

## 2. Service layer

### 2.1 Shape of a service

Services are plain modules that receive an **auth context** and validated input, never raw
HTTP:

```ts
// lib/services/nutrition/nutrition.service.ts
import { z } from 'zod';
import { mealRepo } from './nutrition.repo';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { AppError } from '@/lib/core/errors';

export const LogMealInput = z.object({
  date: z.string(),
  meal: z.enum(['breakfast','lunch','dinner','snack']),
  items: z.array(z.object({ foodId: z.string().optional(), freeText: z.string().optional(),
                            qty: z.number(), unit: z.string() })),
  photoUrl: z.string().url().optional(),
  source: z.enum(['app','whatsapp','voice']).default('app'),
});

export async function logMeal(ctx: AuthContext, raw: unknown) {
  const input = LogMealInput.parse(raw);                 // validation
  const resolved = await resolveMacros(input.items);     // invisible math (PRD A3)
  const doc = await mealRepo.insert(ctx.clerkUserId, { ...input, ...resolved });
  await MemoryService.recordSignal({                     // feed Coach Memory (doc 02)
    clerkUserId: ctx.clerkUserId, source: input.source,
    type: 'meal_logged', payload: { kcal: resolved.kcal, ...resolved.macros }, occurredAt: new Date(),
  });
  return doc;
}
```

Key properties: takes `ctx` (who) + `raw` (what), validates with Zod, scopes data by
`ctx.clerkUserId`, records memory signals, returns a plain object. **No `Request`, no
`Response`, no `cookies()`.** This exact function is callable from a REST handler, a Server
Action, the WhatsApp router, or a job.

### 2.2 Auth context

```ts
interface AuthContext {
  clerkUserId: string;
  role: 'user'|'trainer'|'nutritionist'|'admin';
  plan: 'free'|'premium'|'pro';
  source: 'web'|'mobile'|'whatsapp'|'system';
}
```
Built once at the entrypoint (from Clerk on web/mobile, from `wa_contacts` on WhatsApp) and
passed down. Authorization checks (role, plan gating, trainer→client relationship) happen in
services against `ctx`.

### 2.3 Policy functions (deterministic intelligence)
Pure functions that make the safety-critical decisions Coach Memory feeds (doc 02 §6):
`decideTodayShape()`, `adjustWeeklyPlan()`, `shouldTriggerComeback()`, `pickCoachingTone()`,
`detectMode()`. No LLM, fully unit-testable. The LLM only *expresses* their output.

### 2.4 Domain events
Services emit events (`meal.logged`, `workout.completed`, `user.lapsed`) consumed by:
- the **memory** subsystem (→ signals),
- **async jobs** (weekly story, nudges, reflection),
- **analytics**.
Start with an in-process emitter; swap to a queue (Upstash QStash / SQS) at scale without
touching service code.

---

## 3. API-first design (REST `/api/v1`)

Even though web uses Server Actions, we expose a **versioned REST API** as the contract for
mobile and third parties from day one.

### 3.1 Conventions
- **Base:** `/api/v1`. Breaking changes → `/api/v2`; old version supported during deprecation.
- **Resources:** `/api/v1/meals`, `/workouts`, `/progress`, `/today`, `/coach/messages`,
  `/plans/current`, `/subscriptions`, `/trainers`, `/families`, `/timeline`.
- **Verbs:** standard REST (GET/POST/PATCH/DELETE).
- **Envelope:**
  ```json
  { "data": { }, "meta": { "requestId": "…" } }
  // errors
  { "error": { "code": "PLAN_LIMIT", "message": "Upgrade to Premium", "details": {} } }
  ```
- **Errors:** typed `AppError` → consistent HTTP status + stable `code` (clients switch on `code`, not message — important for i18n + mobile).
- **Pagination:** cursor-based (`?cursor=&limit=`) — stable for infinite lists and mobile.
- **Idempotency:** mutating endpoints accept `Idempotency-Key` header (critical for mobile
  retries on flaky networks and for payments).
- **Validation:** the same Zod schema used by the service validates the request.

### 3.2 Thin REST handler example

```ts
// app/api/v1/meals/route.ts
import { auth } from '@clerk/nextjs/server';
import { buildContext } from '@/lib/core/context';
import { logMeal } from '@/lib/services/nutrition/nutrition.service';
import { ok, fail } from '@/lib/core/http';

export async function POST(req: Request) {
  const { userId } = await auth();                       // Clerk
  if (!userId) return fail('UNAUTHENTICATED', 401);
  const ctx = await buildContext(userId, 'web');
  try {
    const data = await logMeal(ctx, await req.json());
    return ok(data);
  } catch (e) { return fail(e); }
}
```
> Per `AGENTS.md`, the implementer reads `node_modules/next/dist/docs/` before writing route
> handlers / Server Actions, because the installed Next.js (16.x) differs from training data
> (e.g., async `auth()`, route handler signatures). Snippets here are architectural intent.

### 3.3 Server Actions (web ergonomics) vs REST (mobile/3rd-party)
- **Server Actions** power web forms/mutations for great UX and progressive enhancement —
  but they call the **same service functions**.
- **REST** is the durable contract for mobile/WhatsApp/partners.
- Net: one service, two thin transports. No logic duplication.

---

## 4. Mobile-readiness (no web-only assumptions)

| Requirement | How we satisfy it |
|---|---|
| Stateless auth usable by native apps | Clerk issues session/JWT tokens; REST accepts **`Authorization: Bearer`** (not cookie-only). Clerk has Expo/React Native + Flutter-compatible flows (doc 05/07). |
| No reliance on browser-only APIs in core | All logic in services; entrypoints adapt per platform. No `window`/`document` in services. |
| Stable contract | Versioned `/api/v1` + an **OpenAPI 3.1 spec** generated from Zod (e.g., `zod-to-openapi`) → typed mobile clients + docs. |
| Flaky networks | Idempotency keys, cursor pagination, and a **delta sync** endpoint (`GET /api/v1/sync?since=`) so a mobile app can reconcile offline logs. |
| Media from mobile | Direct-to-Cloudinary signed uploads; clients send the resulting URL (same as web). |
| Push to devices | Notification service abstracts web push now, FCM/APNs later (doc 07) — same `notify()` call. |
| Consistent errors | Stable `error.code` enums so clients localize and branch without parsing English. |

The litmus test for every feature: *"Could a Flutter app do this with only the REST API and a
Clerk token?"* If not, logic has leaked out of the service layer.

---

## 5. AI provider abstraction (OpenAI + Claude + Gemini)

A single interface with **task-based routing** and graceful fallback (preserving the
deterministic fallback already in `lib/ai.ts`):

```ts
// lib/ai/types.ts
interface AIProvider {
  name: 'openai'|'claude'|'gemini';
  complete(req: { system: string; messages: Msg[]; json?: boolean }): Promise<string>;
  vision?(req: { imageUrl: string; prompt: string }): Promise<string>;
  transcribe?(req: { audioUrl: string; langHint?: string }): Promise<string>; // voice §A5
}

// lib/ai/router.ts  — choose provider by task + cost
const route = {
  nudge:        'gemini',     // cheap/frequent
  coach_chat:   'claude',     // quality conversation
  weekly_story: 'claude',
  meal_vision:  'openai',     // gpt-4o-class vision
  plan_json:    'gemini',
} as const;

export async function runAITask(task: keyof typeof route, req: AIReq) {
  try { return await providers[route[task]].run(req); }
  catch { return await deterministicFallback(task, req); }   // never hard-fail
}
```
- **Cost control** (vision §10): cheap models for routine work, premium for real coaching;
  Coach Brief keeps context small (doc 02 §10).
- **Fallback:** if all providers fail, the rule-based generator (ported from current
  `lib/ai.ts`) still returns a usable plan/answer. The product never dies without an API key.

---

## 6. Integration adapters (everything external behind an interface)

`PaymentProvider` (Razorpay/Stripe — doc 09), `StorageProvider` (Cloudinary/Vercel Blob),
`MessagingProvider` (WhatsApp/Meta — doc 06), `PushProvider` (web/FCM/APNs), `EmailProvider`
(Resend). Swapping a vendor = new adapter, zero service changes. This is exactly how WhatsApp
"turns on" once Meta credentials arrive — the adapter goes from stub to live behind a flag,
core architecture unchanged (vision §5.3, doc 06).

---

## 7. Async jobs & schedules

- **Reflection** (doc 02 §4): nightly + event-triggered memory compaction.
- **Today generation**: pre-dawn per active user (or lazy on first open).
- **Weekly Story**: weekly per user.
- **Nudges/reminders**: scheduled by per-user quiet hours + patterns.
- **Comeback sweep**: detect lapses → trigger warm re-entry.
Runner: Vercel Cron / Atlas Triggers now; queue (QStash) when volume needs it. Jobs call the
**same services** — no special logic.

---

## 8. End-to-end: "I ate 2 roti and dal" from two doors

1. **Web:** form → Server Action → `nutrition.logMeal(ctx, input)`.
2. **WhatsApp:** inbound text/voice → webhook → intent router → `nutrition.logMeal(ctx, input)`.

Both hit the identical service, write the same `meal_logs` doc, emit the same `meal_logged`
memory signal, and return the same shape. **One brain, many doors** — proven by construction.

---

## 9. Testing

- Services + policy fns: pure unit tests (no HTTP, no DB via repo mocks) — fast, high coverage.
- Repositories: integration tests against an ephemeral Atlas/`mongodb-memory-server`.
- Contract tests: validate REST responses against the OpenAPI spec.
- The deterministic policy layer (Today, comeback, mode detection) gets the most test love —
  it's the safety-critical core.
