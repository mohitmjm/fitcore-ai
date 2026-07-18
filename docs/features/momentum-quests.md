# Momentum Quests

Momentum Quests are FitCore's mobile-first daily return loop: one member chooses one short,
readiness-aware action from strength, movement, or recovery. One completion earns the day, all
three lanes award equal XP, and missed days remain visually neutral.

## Why this feature exists

The 2025 Strava trend report highlights multi-activity tracking, weight training, walking,
community, mobile recording, recovery, and AI coaching as major behavior shifts. Apple's Workout
Buddy similarly centers private, history-aware motivation during a session. Randomized trials
have also found that behaviorally designed points, levels, and social support can improve physical
activity and retention.

Product references:

- https://press.strava.com/en-gb/articles/strava-releases-12th-annual-year-in-sport-trend-report-2025
- https://www.apple.com/au/newsroom/2025/09/new-apple-intelligence-features-are-available-today/
- https://pubmed.ncbi.nlm.nih.gov/31498375/
- https://pubmed.ncbi.nlm.nih.gov/40629523/

## Product contract

- Three deterministic choices per local calendar day: strength, movement, and recovery.
- Readiness changes recommendation and duration, but never removes member choice.
- One completion per member per day. The server validates the quest ID and awards 12 XP.
- Recovery counts exactly like training. There is no paid streak repair, loss aversion copy, or
  shame notification.
- The seven-day path uses neutral open days instead of broken or failed days.
- Guided focus mode includes optional browser-local voice cues and a clear stop-if-unwell note.
- Crew Boost sharing is explicit and contains no identity, readiness score, or health data.

## Architecture

- Pure policy: `lib/policy/momentum.ts`
- Owner-scoped service: `lib/services/momentum/`
- API: `GET|POST /api/v1/momentum`
- UI: `/momentum` and `components/momentum/`
- Persistence: `momentum_quest_completions`, unique on `clerkUserId + date`
- Coach signal: `quest_completed`
- Domain event: `momentum_quest.completed`

The zero-credential in-memory database remains supported. AI keys and wearable integrations are
not required.
