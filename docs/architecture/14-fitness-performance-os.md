# Fitcore Performance OS — implementation decision record

> Status: implemented foundation · Last updated: 2026-07-17

## Product decision

Fitcore Fitness World is a projection of genuine fitness actions, not a parallel store of game
state. Workouts, habit logs, readiness, meal logs, plan feedback, and comeback events enter the
existing append-only `memory_signals` stream. The world policy derives XP, levels, missions,
scores, zones, boss damage, achievements, and projections from that source of truth.

This choice prevents a common gamification failure: the game saying one thing while the fitness
history says another. It also allows web, future mobile clients, and WhatsApp to evolve the same
world through the existing service layer.

## Shipped architecture

```text
verified domain actions
  └─ memory_signals + habit_logs + readiness + workout plan
       ├─ gamification policy (validated XP, levels, badge progress)
       ├─ Fitness World policy (missions, scores, zones, boss, future ranges)
       ├─ adaptive difficulty policy (post-session feedback and safety gate)
       └─ API services
            ├─ GET /api/v1/world
            └─ POST /api/v1/workout-feedback
```

Route handlers authenticate, validate, and delegate. Product logic remains in pure policies and
services so it is testable and reusable by a future native application.

## XP integrity and safety

- XP is generated from recorded domain events, never from page views or button animations.
- Duplicate event fingerprints are ignored.
- Each event type has a per-day cap. Repeated meal, message, or workout logging cannot generate
  unlimited XP.
- Pain feedback never progresses load. It records a safety-review signal and pauses automatic
  progression.
- Recovery readiness can shrink a daily training mission to one gentle action.
- Streaks use the existing grace-day consistency policy; missing days are not punished with
  negative XP.
- Essential form, recovery, and safety guidance is never level-gated.

## Level and world progression

| Levels | Identity |
| --- | --- |
| 1–5 | Foundation |
| 6–10 | Consistent |
| 11–20 | Challenger |
| 21–35 | Athlete |
| 36–50 | Advanced |
| 51–75 | Elite |
| 76–99 | Master |
| 100 | Fitcore Legend |

Zones unlock from balanced attributes rather than raw exercise volume. Strength, endurance,
mobility, nutrition, and recovery areas each depend on their relevant signals. Elite Zone depends
on long-horizon identity level.

## Exercise motion architecture

The motion engine uses one lightweight SVG joint rig. The asset is code-native, cached with the
application bundle, responsive, low-bandwidth, and compatible with reduced-motion preferences.
Each exercise has an `ExerciseAnimationConfig` containing:

- exercise ID and slug;
- movement template, body position, and camera angle;
- start and end joint poses;
- movement range, tempo, and repetition duration;
- primary and secondary muscle activation;
- equipment movement;
- safety constraints, phase markers, breathing cue, and supported fallback.

The validator runs with `npm run validate:animations` and fails when a catalog exercise has no
definition or primary muscle mapping.

### Current catalog coverage

All 22 current exercises are mapped. Twenty-one reusable motion templates are used; Goblet Squat
and Sumo Squat share the squat rig but keep different camera, joint-range, equipment, and coaching
configuration.

| Exercise | Motion template |
| --- | --- |
| Incline dumbbell press | incline-press |
| Push-up | push-up |
| Seated dumbbell shoulder press | overhead-press |
| Dumbbell lateral raise | lateral-raise |
| Band reverse fly | reverse-fly |
| Alternating dumbbell curl | curl |
| Overhead triceps extension | overhead-extension |
| Seated wrist curl | wrist-curl |
| Dead bug | dead-bug |
| Reverse crunch | reverse-crunch |
| Side plank | side-plank |
| Dumbbell shrug | shrug |
| One-arm dumbbell row | row |
| Neutral-grip lat pulldown | pulldown |
| Bird dog | bird-dog |
| Hip thrust | hip-thrust |
| Goblet squat | squat |
| Dumbbell Romanian deadlift | hinge |
| Standing calf raise | calf-raise |
| Banded hip-flexor march | march |
| Sumo squat | squat |
| Band lateral walk | lateral-walk |

Unknown AI-generated plan exercise names fail safely into an existing supported movement pattern;
they never render a broken media asset.

## Form Coach boundary

The initial Form Coach implements explicit camera permission, a local video stream, target overlay,
tempo rep interface, short local recording, privacy copy, supported-exercise guides, pose landmark
types, joint-angle types, feedback types, confidence, and a safety disclaimer.

No upload occurs. No pose model is loaded in this release and the UI says so. MediaPipe or MoveNet
can be introduced behind the typed local processing boundary without changing the page contract.
Fitcore does not claim medical or biomechanical accuracy.

## Database decision

No relational migration is required for this phase. Game state is deliberately derived from the
existing event stream rather than duplicated in mutable XP, mission, or badge tables. The existing
MongoDB `memory_signals` compound index (`clerkUserId`, `occurredAt`) supports the projection. New
post-workout feedback uses the existing `plan_feedback` signal type.

When social challenges or claimed cosmetic inventory become transactional, add dedicated owned
collections (`challenge_participants`, `user_avatar_items`, `xp_transactions`) with unique event
keys and user-scoped compound indexes. Do not add them before there is state that cannot be safely
derived.

## Performance and accessibility

- No exercise asset bundle or 3D model is loaded at runtime.
- The motion player pauses, supports slow motion, and has a textual technique alternative.
- Reduced-motion turns procedural loops off.
- The body explorer remains keyboard and touch accessible.
- World content is ordinary semantic HTML beneath the visual map.
- Mobile navigation follows Today, Explore, Train, World, Profile.
- Camera access occurs only after an explicit user action.

## Deployment

1. Set Clerk and datastore environment variables from `.env.example` in the hosting environment.
2. Install dependencies with `npm ci`.
3. Run `npm test`, `npm run lint`, `npm run validate:animations`, and `npm run build`.
4. Deploy the resulting Next.js application using the existing Vercel configuration/process.
5. Verify `/today`, `/exercises`, `/world`, `/workout`, `/form-coach`, and `/achievements` at mobile
   and desktop widths.

Camera mode requires HTTPS in production (localhost is allowed for development).
