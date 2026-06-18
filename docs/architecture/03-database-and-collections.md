# FitCore AI — Database & MongoDB Collections

> Document 03 of the architecture set · Status: DRAFT FOR APPROVAL
> Governed by `vision-and-north-star.md`. Covers your requested "Database Schema" + "MongoDB
> Collections" deliverables.

---

## 1. Critical differences from the old Supabase model

Moving from Postgres+RLS to MongoDB changes two things we must get right:

1. **No Row-Level Security.** Postgres enforced "users see only their rows" in the database.
   MongoDB has none of that. **Authorization is now the application's job** — every query is
   scoped by `clerkUserId` in the service/repository layer. This is the single biggest risk in
   the migration and is treated as a hard rule (§4, doc 08).
2. **Identity lives in Clerk.** There is no `auth.users` table. Clerk owns authentication;
   our `users` collection is a **profile/domain** document keyed by `clerkUserId` (a string),
   kept in sync via Clerk webhooks (doc 05). We never store passwords.

We **keep** the good habits from the existing schema: audit fields, soft delete, explicit
indexes, and validation.

---

## 2. Connection pattern (serverless — get this right or it breaks at scale)

On Vercel, every function invocation can create a new connection; unbounded connections will
exhaust the Atlas pool. We use a **cached global client** and the official driver.

```ts
// lib/db/mongo.ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const options = { maxPoolSize: 10, minPoolSize: 0 };

let clientPromise: Promise<MongoClient>;
declare global { var _mongoClientPromise: Promise<MongoClient> | undefined; }

if (!global._mongoClientPromise) {
  global._mongoClientPromise = new MongoClient(uri, options).connect();
}
clientPromise = global._mongoClientPromise;

export const getDb = async () => (await clientPromise).db('fitcore');
```

- **Driver choice:** official `mongodb` driver + a thin repository layer + **Zod** for
  validation (lightweight, full control, no Mongoose cold-start overhead). Mongoose is a viable
  alternative if the team prefers schema middleware; decision noted in doc 00.
- For heavy read fan-out at scale, consider the **Atlas Data API** / a connection proxy; not
  needed initially.

---

## 3. Conventions (every collection)

- **`clerkUserId: string`** is the ownership key on all user-owned docs (indexed).
- **Audit:** `createdAt`, `updatedAt`, and where relevant `createdBy`, `updatedBy`.
- **Soft delete:** `isActive: boolean`, `deletedAt`, `deletedBy` (we don't hard-delete user
  history; we mark inactive — mirrors existing practice).
- **Validation:** MongoDB `$jsonSchema` validator on the collection **and** Zod at the service
  boundary (defense in depth).
- **IDs:** `_id: ObjectId`. External/shareable IDs use a separate short `publicId` where needed.
- **Money:** integers in the smallest unit (paise/cents), never floats.

---

## 4. Authorization model (replaces RLS)

Because Mongo has no RLS, we enforce ownership in a **repository base class** that *requires*
an owner scope on every read/write:

```ts
// every user-owned query MUST pass through here
class OwnedRepo<T> {
  constructor(private coll: Collection<T>) {}
  find(clerkUserId: string, filter: Filter<T> = {}) {
    return this.coll.find({ ...filter, clerkUserId, isActive: true } as Filter<T>);
  }
  // update/delete similarly force { clerkUserId } into the filter
}
```

Rules (enforced in review + lint):
- No route handler talks to a collection directly — only through services/repos.
- Cross-user reads (trainer→client) require an **explicit relationship check** against
  `trainer_clients` before the query runs (doc 08).
- Admin/service operations use a separate, audited code path.

---

## 5. Collections by domain

### 5.1 Identity & roles

**`users`** — domain profile (auth is Clerk's).
```ts
interface UserDoc {
  _id: ObjectId;
  clerkUserId: string;            // unique, synced from Clerk
  email: string; name: string; imageUrl?: string;
  role: 'user'|'trainer'|'nutritionist'|'admin';   // default 'user'
  phone?: string;                 // E.164 — links WhatsApp (doc 06)
  // onboarding (stored permanently; never re-asked)
  profile: {
    gender?: 'male'|'female'|'other'; dob?: string;
    heightCm?: number; weightKg?: number;
    goal?: string; activityLevel?: string; experience?: string;
    dietType?: string; injuries?: string[]; conditions?: string[]; allergies?: string[];
    equipment?: string[];
  };
  onboardingCompletedAt?: Date;
  locale: 'english'|'hindi'|'hinglish';
  subscription: { plan: 'free'|'premium'|'pro'; status: string; renewsAt?: Date };  // mirror, source in `subscriptions`
  isActive: boolean; createdAt: Date; updatedAt: Date;
}
```
Indexes: `{ clerkUserId: 1 } unique`, `{ email: 1 } unique`, `{ phone: 1 } sparse unique`, `{ role: 1 }`.

**`trainer_profiles`** / **`nutritionist_profiles`** — `clerkUserId`, bio, certifications[],
pricing, verificationStatus (`pending|verified|rejected`), rating, reviewCount. Index `{ clerkUserId } unique`, `{ verificationStatus }`, `{ rating: -1 }`.

**`trainer_clients`** — the relationship that authorizes cross-user reads.
`{ trainerClerkId, clientClerkId, status: 'invited'|'active'|'ended', since }`. Indexes
`{ trainerClerkId, status }`, `{ clientClerkId, status }`, unique `{ trainerClerkId, clientClerkId }`.

**`families`** (Family Mode §5.12) — `{ ownerClerkId, members: [{ clerkUserId, relation, shareLevel }], challenges?: [...] }`. Index `{ 'members.clerkUserId': 1 }`.

**`audit_logs`** — append-only security/audit trail (doc 08). Time-series or capped; index `{ clerkUserId, at }`, `{ action, at }`.

### 5.2 Coach / AI  (owned by doc 02)
`coach_memory` (1/user, unique `clerkUserId`), `memory_signals` (**time-series**, index
`{ clerkUserId, processed, occurredAt }`, **TTL** ~180d), `ai_conversations`, `ai_messages`
(index `{ conversationId, createdAt }`).

### 5.3 Workouts
**`exercises`** — catalog (500+): name, description, targetMuscles[], equipment[], difficulty,
imageUrl, videoUrl, instructions[], aliases[] (for NLU). Indexes `{ targetMuscles }`,
`{ equipment }`, text index on `{ name, aliases }`. *Shared, not user-owned.*

**`workout_plans`** — the Living Plan (current + history). `clerkUserId`, `weekOf`,
`days: [{ day, focus, exercises: [{ exerciseId, sets, reps, restSec, tip }] }]`,
`mode` (normal/exam/...), `generatedBy`, `version`. Index `{ clerkUserId, weekOf: -1 }`.

**`workout_sessions`** — a logged session with **embedded sets** (1:1 read pattern):
```ts
{ clerkUserId, date, planRef?, exercises: [
    { exerciseId, name, sets: [{ reps, weightKg, rpe?, done }] , volume } ],
  totalVolume, durationMin, source: 'app'|'whatsapp'|'voice' }
```
Index `{ clerkUserId, date: -1 }`.

**`personal_records`** — `{ clerkUserId, exerciseId, type: '1rm'|'volume'|'reps', value, achievedAt }`. Index `{ clerkUserId, exerciseId }`.

### 5.4 Nutrition
**`foods`** — catalog with Indian-cuisine coverage: name, aliases[], per100g {kcal, protein,
carbs, fat, fiber}, servingUnits[]. Text index on `{ name, aliases }`. *Shared.*

**`meal_logs`** — `{ clerkUserId, date, meal: 'breakfast'|'lunch'|'dinner'|'snack',
items: [{ foodId?, freeText?, qty, unit, kcal, macros }], photoUrl?, source, aiConfidence? }`.
Index `{ clerkUserId, date: -1 }`.

**`water_logs`** — `{ clerkUserId, date, ml, source }`. Index `{ clerkUserId, date: -1 }`.
**`daily_targets`** — `{ clerkUserId, date, kcal, protein, carbs, fat, waterMl }` (computed).
**`grocery_lists`** — `{ clerkUserId, weekOf, items: [{ name, qty, have }] }`.

### 5.5 Progress
**`progress_logs`** — `{ clerkUserId, date, weightKg?, bodyFatPct?, leanMassKg?, measurements?{} }`. Index `{ clerkUserId, date: -1 }`.
**`progress_photos`** — `{ clerkUserId, url, takenAt, pose? }` (Cloudinary URL). Index `{ clerkUserId, takenAt: -1 }`.
**`health_timeline_entries`** (C5) — `{ clerkUserId, periodMonth, narrative, highlights[], generatedAt }`. Index `{ clerkUserId, periodMonth: -1 }`.

### 5.6 Engagement (gamification = supporting actor)
`habits`, `habit_logs`, `streaks` (`{ clerkUserId, kind, current, longest, protectedUntil?, lastAt }`),
`xp_ledger` (append-only `{ clerkUserId, delta, reason, at }`), `badges` (catalog),
`user_badges`, `challenges`, `challenge_participants`. Streak doc carries `protectedUntil`
to implement Comeback/Exam protection (D1/D2/B7).

### 5.7 Coaching surfaces
`daily_today` (generated card cache, TTL end-of-day) — `{ clerkUserId, date, card, reason }`.
`weekly_stories` (C3) — `{ clerkUserId, weekOf, story, shareImageUrl, shared }`.

### 5.8 Community (kept light, vision §7)
`posts`, `comments`, `likes`, `follows`, `groups`, `group_members`. Intentionally minimal;
no algorithmic infinite feed. Indexes on `{ authorClerkId, createdAt }`, `{ groupId, createdAt }`.

### 5.9 Marketplace
`coaching_programs` (`{ trainerClerkId, title, price, ... }`), `program_purchases`,
`bookings` (`{ trainerClerkId, clientClerkId, slot, status }`), `reviews`
(`{ trainerClerkId, clientClerkId, rating, text }`). Index booking by `{ trainerClerkId, slot }`.

### 5.10 Monetization (transactions required — see §6)
`subscriptions` (`{ clerkUserId, plan, provider: 'razorpay'|'stripe', providerSubId, status,
currentPeriodEnd }`), `payments` (`{ clerkUserId, provider, providerPaymentId, amount(minor),
currency, status, at }`), `coupons`, `referrals` (`{ referrerClerkId, refereeClerkId, status,
rewardGrantedAt }`), `affiliates`. Detail in doc 09.

### 5.11 Platform
`notifications`, `notification_prefs` (per-channel/category + quiet hours),
`wearable_connections` (`{ clerkUserId, provider, tokensRef }`), `wearable_data`
(**time-series**: steps/hr/sleep), `waitlist`, `blog_posts` (CMS/SEO), `testimonials`,
`analytics_events` (**time-series**).

### 5.12 WhatsApp (owned by doc 06)
`wa_contacts` (`{ clerkUserId, phoneE164, optInAt, optOutAt, lastSessionAt }`, unique `{ phoneE164 }`),
`wa_messages` (in/out log, index `{ phoneE164, createdAt }`), `wa_templates` (approved template registry).

---

## 6. Transactions

Multi-document operations that must be atomic use MongoDB multi-doc transactions (replica
set / Atlas supports them):
- Subscription activation: write `payments` + update `subscriptions` + mirror `users.subscription`.
- Referral reward: credit referrer + mark `referrals` + ledger entry.
- Program purchase: create `program_purchases` + `payments` + grant access.

Everything else (logs, signals) is single-doc and naturally atomic.

---

## 7. Indexing & performance strategy

- Every hot list query has a **compound index** ending in the sort field (`{ clerkUserId, date: -1 }` pattern).
- **Text indexes** on `exercises` and `foods` for NLU/search (Indian aliases included).
- **TTL indexes** on `memory_signals`, `daily_today`, ephemeral OTP/session-ish docs.
- **Time-series collections** for `memory_signals`, `analytics_events`, `wearable_data` (efficient, auto-bucketed).
- Avoid unbounded array growth (e.g., don't embed all sessions in the user doc — reference instead).

---

## 8. Scale to 1M+ users

- **Sharding** (when needed): hashed `clerkUserId` shard key on the largest user-owned
  collections (`workout_sessions`, `meal_logs`, `memory_signals`, `analytics_events`) so a
  user's data + load distribute evenly.
- **Read scaling:** Atlas replica reads for analytics/admin dashboards; primary for user writes.
- **Hot/cold:** archive old `memory_signals` (the durable brief retains value); Atlas Online Archive for cold history.
- **Caching:** Redis/Upstash for Coach Brief, Today card, session/rate-limit state.
- **Catalogs** (`exercises`, `foods`) are read-mostly → cache aggressively / edge-cache.

---

## 9. Migration note (from existing Supabase data)

If item 6 of the doc 00 approval gate confirms real data exists, we write a one-time ETL:
Supabase `users`/plans/logs → Mongo collections, mapping `auth.uid()` → `clerkUserId` (created
by importing users into Clerk first). If `data/users.json` + Supabase are a dev sandbox, we
skip ETL and seed fresh. **No Supabase teardown until this is confirmed.**
