# FitCore Weekly Story

FitCore Weekly Story turns one completed week of user-owned activity into a frozen, replayable
story. Its product rule is simple: celebrate sustained effort and honest returns, never
perfection, shame, or screen time.

## Workflow

1. The authenticated request resolves a local Monday–Sunday range in the member's timezone.
2. The service reads the requested and previous week, a capped signal history matching the
   gamification service, an 84-day progress window, two weeks of habits, Coach Memory, and the
   current plan. Progress photos are not queried unless the member explicitly opts in.
3. `lib/policy/weekly-story.ts` calculates commitment-relative consistency, comparisons,
   highlights, comeback eligibility, supported coach observations, derived XP/level state, one
   next-week focus, privacy-safe share facts, and an ordered 7–10 card story.
4. `weekly_story_narrative` may rephrase eight bounded text fields. Zod validation, numeric-claim
   checks, safety rules, provider failure handling, and the existing mock provider guarantee a
   deterministic fallback.
5. The service stores an immutable content revision in `weekly_story_snapshots`. Engagement
   metadata can change, but calculation facts, cards, provider, and template versions do not.

## API

All routes use the existing `{ data, meta }` / `{ error }` envelope, Clerk-derived ownership,
Zod input validation, private no-store responses, and node runtime:

- `GET /api/v1/weekly-story` — current, previous, or a specific authorised week
- `POST /api/v1/weekly-story/generate` — idempotent generation
- `POST /api/v1/weekly-story/regenerate` — explicit, rate-limited new revision
- `GET /api/v1/weekly-story/history?limit=&cursor=` — lightweight cursor archive summaries
- `POST /api/v1/weekly-story/viewed` — view event
- `POST /api/v1/weekly-story/share` — share, copy, or download event with safe settings
- `DELETE /api/v1/weekly-story` — owner-scoped soft deletion

The client never sends or selects a `clerkUserId`. Snapshot IDs are random UUIDs and still
require the authenticated owner scope.

## Privacy and sharing

The default external card hides the member's name and level. Weight, measurements, photos,
injuries, conditions, email, user IDs, and Coach Memory details are not part of share facts.
The share review lets the member choose from a fixed allow-list of safe fields.

The exporter is a dedicated browser canvas renderer loaded only when requested. It produces
1080×1920 PNG files without a third-party render service or embedded application metadata.
Native file sharing is used where supported; download, copy, WhatsApp text, and Instagram
instructions are always available as fallbacks. Private progress-photo cards remain in-app and
cannot be exported.

## Storage and indexes

`lib/db/indexes.ts` creates these idempotently on the real MongoDB path:

- unique `{ clerkUserId, weekStart, version }`
- `{ clerkUserId, generatedAt: -1 }` for history
- unique `{ clerkUserId, snapshotId }`

No data migration is required. Existing deployments create the indexes on the first database
connection. The in-memory development database supports the same filters, counters, and snapshot
workflow but remains intentionally non-persistent.

## Operations

- No AI key: deterministic narrative, `generationMode: deterministic`.
- No MongoDB: existing in-memory development store.
- No native Web Share: download and copy fallbacks.
- No canvas support/export failure: the in-app story remains usable and the user gets a retry.
- Upstash configured: distributed per-user rate limits. Without it, the process-local limiter
  preserves zero-credential development.
- `WEEKLY_STORY_WHATSAPP_DELIVERY=0` is the default. Provider-neutral template data and the
  `weekly_story.generated` event prepare future delivery, but no automatic message is sent.

## Deployment check

Set the normal Clerk, MongoDB, Supabase, and optional AI/Upstash variables from `.env.example`.
Deploy normally; there is no separate worker or paid image API. After deployment, verify a story
with and without an AI key, confirm the three indexes, test a private browsing session returns
401, export a share card on Android/iOS, and confirm progress photos are absent until opt-in.
