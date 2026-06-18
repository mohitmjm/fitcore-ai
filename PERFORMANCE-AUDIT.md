# FitCore AI — Performance Optimization Audit

Grounded in the actual codebase. Each finding lists the problematic code, why it's slow, current
vs new time complexity, the concrete fix, and an expected improvement. Items marked **✅ IMPLEMENTED**
were applied in this pass (build + 31 unit tests green); **◻ RECOMMENDED** items include ready-to-apply code.

> Honesty note: the `/progress` bundle reduction is **measured** from `next build` output. The DB /
> API improvements are **reasoned** from complexity + round-trip counts (no load test was run).

---

## ✅ 1. Missing MongoDB indexes — every read was a collection scan (HIGH)

**Problem.** Every user-scoped query filtered by `clerkUserId` and sorted by recency with no index:

```ts
// memory.service / consistency.service / gamification.service
await coll.find({ clerkUserId }).sort({ occurredAt: -1 }).limit(500).toArray();
await coll.findOne({ clerkUserId });                       // coach_memory, users
```

**Why slow.** With no index, MongoDB does a `COLLSCAN` over the *entire* collection plus an
in-memory `SORT`. Worse: an unindexed sort **aborts** once it exceeds 32 MB — so this doesn't just
get slow at scale, it *fails*.

- **Current:** O(N) scan + O(N log N) sort per query (N = docs in the whole collection).

**Fix (`lib/db/indexes.ts`, wired once in `getDb`).**
```ts
db.collection('memory_signals').createIndex({ clerkUserId: 1, occurredAt: -1 }, { name: 'user_recent' });
db.collection('coach_memory').createIndex({ clerkUserId: 1 }, { name: 'user' });
// + users, coach_messages, workout_plans, diet_plans, workout_completions, habit_logs,
//   progress_logs, progress_photos, channel_contacts
```
Fired fire-and-forget once per process on the real-Mongo path only (the dev store has no indexes).

- **New:** O(log N + k) index range scan (k = limit). Also removes the 32 MB sort-abort failure mode.
- **Expected:** 10–1000× on signal/plan/memory reads as data grows; at 1M users this is the
  difference between "works" and "errors out."

---

## ✅ 2. `getToday` read amplification — 5 reads + a write per load (HIGH)

**Problem.** The most-hit endpoint read the signal stream **3×** and memory **2×**, and wrote every load:

```ts
await MemoryService.reflect(...)          // reads 500 signals + reads coach_memory + WRITES
const [memory, plan, daysSince, consistency] = await Promise.all([
  MemoryService.getMemory(...),           // reads coach_memory AGAIN
  PlanService.getCurrent(...),
  MemoryService.daysSinceLastActivity(...),// reads signals AGAIN
  ConsistencyService.getSummary(...),      // reads 500 signals AGAIN
]);
```
Per load: `memory_signals` ×3, `coach_memory` ×2, **1 write** — and `reflect` ran *before* the
parallel block (serialized).

- **Current:** 3 × O(N log N) signal scans + 2 memory reads + 1 write; partly serial.

**Fix.** Read each source **once, in parallel**; compute consistency + days-since in-memory from the
same array; reflection reuses the data and **skips the write when nothing changed**:
```ts
const [dates, plan, existingMemory] = await Promise.all([
  ConsistencyService.getActivityDates(ctx.clerkUserId),   // 1 signals read
  PlanService.getCurrent(ctx.clerkUserId),
  MemoryService.getMemory(ctx.clerkUserId),               // 1 memory read
]);
const memory = await MemoryService.reflectFromDates(ctx.clerkUserId, dates, existingMemory); // 0–1 write
const consistency = ConsistencyService.summarize(dates, today); // pure, no DB
const daysSinceLastActivity = daysSinceFrom(dates, today);      // pure, no DB
```
`reflectFromDates` does a compare-before-write: on a Today load where the trend/adherence/lapse
risk are unchanged, **no write happens at all**.

- **New:** 3 parallel index-backed reads + occasional write.
- **Expected:** ~3× fewer DB round-trips on the hottest path; writes on Today loads drop from 100%
  to only-when-changed (often <5%). Combined with #1, Today endpoint latency ≈ **‑50–70%** at small
  scale and far better tail latency under load.

---

## ✅ 3. Unbounded meal-photo upload — memory/DoS vector (HIGH, security)

**Problem.** `POST /api/v1/meal-photo` accepted any base64 string: `z.object({ image: z.string().min(32) })`.
A caller could push an arbitrarily large blob into server memory.

**Fix.**
```ts
const MAX_IMAGE_CHARS = 7_000_000; // ~5 MB decoded; client already downscales to ~1024px JPEG
const Body = z.object({ image: z.string().min(32).max(MAX_IMAGE_CHARS) });
```
- **Expected:** bounded request memory; rejects abuse early (O(1) length check).

---

## ✅ 4. `/progress` shipped Recharts eagerly — 219 kB First Load JS (MEDIUM)

**Problem.** `recharts` (~110 kB) was a top-level import, so it landed in the route's initial bundle
even before any chart rendered. Build output: `/progress  116 kB  219 kB` (2× every other route).

**Fix.** Extracted the chart to `app/progress/ProgressChart.tsx` and lazy-loaded it:
```ts
const ProgressChart = dynamic(() => import('./ProgressChart'), {
  ssr: false,
  loading: () => <div className="...">Loading chart…</div>,
});
```
- **Measured:** `/progress` First Load JS **219 kB → 108 kB (‑51%)**; page chunk 116 kB → 5.82 kB.
  Recharts now loads on demand.

---

## ✅ 5. Unused `@supabase/supabase-js` dependency (QUICK WIN)

Supabase was fully retired (`lib/supabase.ts` + `lib/db.ts` deleted) but the SDK remained in
`package.json`. Removed via `npm uninstall @supabase/supabase-js` (no imports remain). Smaller
install + lockfile; one fewer dependency to audit.

---

## ◻ 6. Achievements page double-scans the signal stream (MEDIUM, recommended)

**Problem.** The page fires two endpoints that read overlapping data:
```ts
Promise.all([fetch('/api/v1/gamification'), fetch('/api/v1/consistency')]);
// gamification: reads 2000 signals + computes consistency internally
// consistency:  reads 500 signals + computes consistency again
```
Two network round-trips + two index scans for data that `computeGamification` already derives.

- **Current:** 2 round-trips, 2 scans (2000 + 500), duplicate consistency math.

**Recommended fix.** Have `computeGamification` also return the consistency summary it already
computes, and drop the second fetch:
```ts
// gamification.ts — return the stats it already calculates
return { xp, level, levelTitle, ..., badges, consistency: { ...stats, trend, momentum } };
// achievements/page.tsx — single fetch
const g = await fetch('/api/v1/gamification').then(r => r.json());
setGame(g.data); setC(g.data.consistency);
```
- **New:** 1 round-trip, 1 scan.
- **Expected:** ‑50% requests + DB work on the Achievements screen.

---

## ◻ 7. Today screen makes 3 round-trips; gamification scans 2000 docs (MEDIUM, recommended)

The Today page calls `/api/v1/today` + `/api/v1/habits` + `/api/v1/gamification`. With #2 done,
`/today` is efficient, but `gamification` still scans up to 2000 signals on every load.

**Recommended.** Fold the level chip + habits into the `/today` payload (one shared signal read,
one round-trip), or adopt **SWR/React Query** for client-side request dedup + caching across the
app. For users exceeding the 2000-signal window, add a periodic **rollup document**
(`stats_daily`) updated by the reflection job so XP/streak reads become O(1).

- **Expected:** Today screen network requests 3 → 1; removes the 2000-doc transfer per load.

---

## ◻ 8. `<img>` for logos instead of `next/image` (LOW, recommended)

Landing nav + `NavigationWrapper` use raw `<img src="/logo.png">` (ESLint `no-img-element` warns).
Switching to `next/image` gives automatic sizing/format/lazy-load and a better LCP. Low impact
(one small logo), low effort.

---

## ◻ 9. Dev in-memory store `find()` is O(n) + O(n log n) per query (LOW, no action)

`lib/db/memory-store.ts` filters then clones+sorts the array per query. This is **dev-only** (used
when `MONGODB_URI` is unset); production uses indexed Mongo. No action needed.

---

## Priority summary

### 🔴 High priority
1. **DB indexes** — ✅ done. Prevents COLLSCAN + 32 MB sort failure; biggest scalability fix.
2. **`getToday` read dedup + throttled write** — ✅ done. Hottest path, ~3× fewer round-trips.
3. **Meal-photo size cap** — ✅ done. Closes a memory/DoS vector.

### 🟡 Medium priority
4. **Lazy-load Recharts** — ✅ done. `/progress` ‑51% initial JS.
5. **Combine Achievements endpoints** (#6) — ◻ recommended. ‑50% requests there.
6. **Fold habits/level into `/today` or add SWR dedup; rollup doc for heavy users** (#7) — ◻ recommended.

### 🟢 Low priority
7. **`next/image` for logos** (#8) — ◻ recommended.
8. Dev store complexity (#9) — no action (dev-only).

### ⚡ Quick wins (<30 min)
- ✅ Remove unused `@supabase/supabase-js` (done).
- ✅ Compare-before-write in reflection (done, part of #2).
- ◻ Add `consistency` to the gamification response + drop the second fetch (#6).
- ◻ Swap two `<img>` logos for `next/image` (#8).

---

## Expected overall speed improvement

- **`/progress` initial JS:** ‑51% (measured: 219 kB → 108 kB).
- **Today endpoint (hottest path):** ‑50–70% latency at current scale (reasoned: 3× fewer
  round-trips + index-backed reads + writes only when changed).
- **Signal/plan/memory reads generally:** O(N log N) scan → O(log N + k); **10–1000×** as data
  grows, and removes a hard failure mode (unindexed 32 MB sort) — the single most important change
  for scaling toward the 1M-user goal.
- **Achievements screen (if #6 applied):** ‑50% requests + DB work.

**Blended estimate for a typical authenticated session: ~40–60% faster today, and the difference
between scaling and breaking at high data volumes.**
