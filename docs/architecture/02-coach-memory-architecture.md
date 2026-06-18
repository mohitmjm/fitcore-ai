# FitCore AI — Coach Memory Architecture

> Document 02 of the architecture set · Status: DRAFT FOR APPROVAL
> Governed by `vision-and-north-star.md` (§5.1 is the source of truth for intent).
>
> Coach Memory is the system that turns "a chatbot" into "my coach." It is the primary moat
> (vision §5.10). Everything adaptive — the Living Plan, Today, nudges, Exam Mode, the Health
> Timeline, tone — reads from it. This document specifies how it is stored, written, compacted,
> read, and governed on MongoDB Atlas.

---

## 1. Principles

1. **Memory is summarized, not hoarded.** We never replay thousands of raw events into a
   prompt. Raw signals stream in; a reflection job compresses them into a compact, current
   "coach brief."
2. **Deterministic where it matters, AI where it helps.** Safety/critical math (calories,
   volume, progression, mode switches) is computed by deterministic policy code. The LLM
   handles generation, tone, and language understanding — never the numbers.
3. **One brain, many doors.** App, WhatsApp, and (future) mobile all write to and read from
   the same memory through the service layer (doc 04).
4. **User-owned and transparent.** The user can see and edit what the coach remembers
   (vision §5.1). Memory is consent-based and deletable.
5. **Compounds over time.** The model gets better the longer someone stays — by design.

---

## 2. The memory model (5 layers)

Coach Memory is a single compact document per user (the durable "brief"), backed by an
append-only raw signal stream and an optional vector index for semantic recall.

```
                 ┌──────────────────────────────────────────────────┐
   app / WA  ───▶ │  memory_signals  (append-only raw event stream)  │
   /voice/system  └───────────────────────┬──────────────────────────┘
                                           │  reflection job (nightly + event-triggered)
                                           ▼
                 ┌──────────────────────────────────────────────────┐
                 │  coach_memory  (1 compact durable doc per user)   │
                 │  context · behavioral · motivational · episodic · │
                 │  preferences · derived(state, mode)               │
                 └───────────────────────┬──────────────────────────┘
                       projection         │        semantic recall (optional)
                   (deterministic)        ▼
                 ┌──────────────────────────────────────────────────┐
                 │  COACH BRIEF  (<~800 tokens) injected into AI     │
                 └──────────────────────────────────────────────────┘
```

### 2.1 `coach_memory` document (the durable brief)

```ts
// lib/services/memory/types.ts
interface CoachMemory {
  _id: ObjectId;
  clerkUserId: string;              // identity key (see doc 03)
  schemaVersion: number;

  // Layer 1 — Context (mostly from onboarding + profile edits)
  context: {
    goal: 'fat_loss' | 'muscle_gain' | 'endurance' | 'general_health';
    experience: 'beginner' | 'intermediate' | 'advanced';
    equipment: ('gym'|'home_gym'|'dumbbells'|'bands'|'bodyweight')[];
    dietType: 'veg'|'vegan'|'non_veg'|'keto'|'high_protein';
    injuries: string[];
    conditions: string[];
    allergies: string[];
    weeklyCommitmentDays: number;   // their chosen consistency target
    schedule: { preferredTrainingTime?: string; busyDays?: string[] };
    lifeContext: {                  // powers Exam/Life Mode (§5.11)
      isStudent?: boolean;
      academicEvents?: { type: 'exam'|'placement'|'internship'|'submission'; from: string; to: string }[];
      knownBusyPeriods?: { reason: string; from: string; to: string }[];
    };
  };

  // Layer 2 — Behavioral (learned)
  behavioral: {
    actualTrainingTimes: string[];        // when they really train
    adherenceRate28d: number;             // 0..1
    frequentlySkipped: { dayOrSlot: string; count: number }[];
    foodPatterns: { weekdayQuality?: number; weekendQuality?: number; commonMeals?: string[] };
    nudgeResponse: { channel: string; window: string; actedRate: number }[];
  };

  // Layer 3 — Motivational (learned)
  motivational: {
    bestCoachingStyle: 'hype'|'calm'|'data'|'tough_love';
    recurringExcuses: string[];
    setbackResponse: 'recovers_fast'|'needs_encouragement'|'goes_quiet';
    currentMotivationTrend: 'rising'|'stable'|'declining';
  };

  // Layer 4 — Episodic (notable events / milestones; semantically searchable)
  episodic: {
    significant: { id: string; date: string; text: string; kind: 'pr'|'milestone'|'event'|'setback' }[];
    recent: { date: string; text: string }[];   // rolling window, summarized periodically
  };

  // Layer 5 — Preferences
  preferences: {
    language: 'english'|'hindi'|'hinglish';
    primaryChannel: 'app'|'whatsapp';
    quietHours: { start: string; end: string; tz: string };
    nudgeFrequency: 'low'|'normal'|'high';
    voiceFirst: boolean;
    familySharing?: { partnerClerkUserId?: string; shareLevel: 'momentum'|'full'|'none' };
  };

  // Derived — computed by deterministic policy, read by Today/plan/nudges
  derived: {
    consistencyScore: number;             // internal (vision §1.1/§7) — not shown as a raw number
    consistencyTrend: 'up'|'flat'|'down';
    currentMode: 'normal'|'exam'|'travel'|'illness'|'busy'|'deload'|'comeback';
    modeWindow?: { from: string; to?: string; reason: string };
    lapseRisk: 'low'|'med'|'high';
    lastActiveAt: string;
    daysSinceLastActivity: number;
  };

  updatedAt: Date;
  createdAt: Date;
}
```

### 2.2 `memory_signals` (append-only raw stream)

```ts
interface MemorySignal {
  _id: ObjectId;
  clerkUserId: string;
  source: 'app'|'whatsapp'|'voice'|'system'|'trainer';
  type: 'workout_logged'|'workout_skipped'|'meal_logged'|'weight_logged'
       | 'checkin'|'message'|'plan_feedback'|'mode_hint'|'streak_event'|'nudge_result';
  payload: Record<string, unknown>;   // small, structured
  occurredAt: Date;
  processed: boolean;                  // set true by reflection job
  createdAt: Date;
}
```

### 2.3 Optional vector index (semantic recall)

Episodic notes and freeform check-in text get embedded and stored for **Atlas Vector Search**
(or a dedicated vector field). Used to retrieve the 2–3 most relevant past moments when the
user asks open-ended questions ("why did I stall in March?"). Structured layers cover the
common path; vectors cover the long tail. Optional for Phase 0; recommended by Phase 2.

---

## 3. Write path (signal ingestion)

Every meaningful interaction emits a signal via the service layer — **never** written ad hoc
from a route handler:

```ts
// lib/services/memory/memory.service.ts
await MemoryService.recordSignal({
  clerkUserId,
  source: 'whatsapp',
  type: 'meal_logged',
  payload: { kcal: 520, protein: 28, dish: 'dal + 2 roti', confidence: 0.7 },
  occurredAt: new Date(),
});
```

Rules:
- Signals are **small and structured** (no blobs). Photos/audio live in storage; signals carry references + extracted facts.
- Writes are **fire-and-forget** from the user's perspective (non-blocking) but durably queued.
- The same call is used by app, WhatsApp webhook, voice pipeline, and trainer actions.

---

## 4. Reflection job (compaction — the cost/quality lever)

The reflection job is what keeps memory compact, current, and cheap.

- **Triggers:** nightly per active user (pg_cron-equivalent via Vercel Cron / Atlas Triggers),
  **plus** event-triggered after high-signal moments (e.g., a week boundary, a long gap, an
  explicit "I have exams" message).
- **Process:**
  1. Load unprocessed `memory_signals` for the user (+ current `coach_memory`).
  2. Deterministic pass updates `behavioral` + `derived` (adherence, trends, mode, lapse risk,
     consistency score) — pure code, testable, no LLM.
  3. LLM pass (cheap model, strict JSON schema output) updates `motivational` and summarizes
     `episodic.recent`, promoting anything notable into `episodic.significant`.
  4. Write the updated `coach_memory`, mark signals `processed`, embed any new episodic notes.
- **Compaction guarantee:** `episodic.recent` is capped (rolling window) and summarized;
  `episodic.significant` is capped with eviction by importance + recency. The brief stays small.
- **Idempotent + versioned:** safe to re-run; `schemaVersion` enables migrations.

---

## 5. Read path (assembling the Coach Brief)

For any AI interaction, the service layer builds a **Coach Brief** — a deterministic projection
of `coach_memory` into a compact prompt block with a strict token budget (~600–800 tokens):

```
COACH BRIEF (user u_123)
Goal: muscle gain · Intermediate · Equipment: home, dumbbells · Diet: veg
Commitment: 4 days/week · Trains ~7pm · Language: Hinglish · Style: hype
State: consistency UP, mode=EXAM (until Jun 24) · lapseRisk=med · 5 days since last workout
Recent: skipped legs x2 · strong upper-body week · said "exams next week"
Watch: tends to quit after 3 misses → protect streak, shrink the ask
```

- The brief is **cached** (Redis/Upstash) per user and invalidated on memory update.
- Semantic recall (optional) appends 2–3 relevant episodic snippets for open-ended questions.
- The brief is injected into every coach call: Today generation, chat answers, nudges,
  weekly Story, voice replies. This is what creates continuity.

---

## 6. How adaptation consumes memory

`derived` is read by deterministic **policy functions** (doc 04 service layer) that drive the
product without an LLM in the safety path:

| Reads from memory | Produces | Where |
|---|---|---|
| `derived.currentMode`, energy, adherence | today's session shape & length | Today (PRD B1) |
| `behavioral.adherenceRate`, skips | weekly plan adjustment | Living Plan (B2) |
| `derived.lapseRisk`, `daysSinceLastActivity` | comeback trigger + shrunk ask | Comeback (D1) |
| `motivational.bestCoachingStyle`, trend | tone + message selection | Coaching voice (C1) |
| `behavioral.nudgeResponse`, `preferences.quietHours` | nudge timing/channel | Nudges (C4) |
| `context.lifeContext.academicEvents` | Exam Mode switch | Exam Mode (B7) |
| `episodic` + metrics | the narrative | Health Timeline (C5) |

The LLM then *expresses* these decisions in the user's language and style. Decisions are
explainable ("Why this today?") because the policy inputs are inspectable.

---

## 7. Exam / Life Mode detection

`derived.currentMode` is set by a deterministic detector that fuses:
- explicit input (onboarding "I'm a student," an added exam date),
- natural-language hints ("exams next week," "placements shuru") parsed to `mode_hint` signals,
- behavioral collapse patterns (sudden multi-day drop) as a soft trigger.

On entering `exam` mode: plan policy caps sessions at ~10 min, swaps to brain-food + sleep
protection, suspends progression, and auto-protects the streak. `modeWindow` carries the exit
date; on exit the coach ramps back. Same machinery powers `travel`, `illness`, `busy`.

---

## 8. Voice & WhatsApp as memory inputs

- Voice notes (Hindi/English/Hinglish) → STT → intent → service action → `recordSignal`. The
  transcript (not the audio) may be stored as an episodic note if meaningful.
- WhatsApp inbound messages route through the same intent layer (doc 06) and emit identical
  signals, so memory is channel-agnostic. "Maine 2 roti aur dal khayi" on WhatsApp and a photo
  log in-app produce the same `meal_logged` signal shape.

---

## 9. "What your coach remembers" (trust + privacy)

- A user-facing screen renders a friendly view of `coach_memory` (context, preferences, what
  the coach has learned, significant moments).
- Users can **edit** (correct a goal, fix an injury), **forget** (delete an episodic memory),
  and **reset** memory. Edits write back through `MemoryService` and emit a `system` signal.
- **Consent & retention:** health data is sensitive (DPDP/GDPR). Memory is consent-gated,
  exportable, and deletable; raw signals have a TTL (e.g., 180 days) since the durable brief
  retains the summarized value. PII is minimized in signals.
- No third-party data sharing; aggregate model improvement uses de-identified data only.

---

## 10. Cost, performance, scale

- **Token control:** compact brief + summarization keeps per-call context small and cheap.
- **Model routing (doc 04):** routine nudges/parsing use cheap models; real coaching/weekly
  reviews use premium models. Deterministic policy handles most "intelligence" for free.
- **Caching:** Coach Brief cached per user; reflection runs off the request path.
- **Indexes:** `coach_memory` unique on `clerkUserId`; `memory_signals` on
  `{ clerkUserId, processed, occurredAt }` for fast unprocessed scans.
- **Scale:** signal stream is append-only and shardable by `clerkUserId`; reflection is
  per-user and embarrassingly parallel.

---

## 11. Cold start & failure modes

- **Cold start:** before enough signals exist, the brief uses onboarding context + sensible
  defaults (style=calm, normal mode). The coach is useful on day 1, sharper by week 4.
- **LLM/reflection failure:** deterministic `derived` still updates; the product keeps working
  (mirrors the existing graceful-fallback ethos in `lib/ai.ts`).
- **Conflicting signals:** most-recent-wins for context; behavioral uses rolling windows so
  one bad day doesn't distort the model.

---

## 12. Collections owned by this system (cross-ref doc 03)

`coach_memory`, `memory_signals`, and (optional) a vector index on episodic notes. Detailed
indexes and validation live in doc 03 (Database & Collections).
