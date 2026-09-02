# FitCore AI

> Your AI fitness coach that builds **consistency** — adaptive plans, a coach that remembers you, and streaks that keep you showing up.

FitCore AI is an AI-powered fitness platform whose North Star is **consistency**, not workouts or
calories. The app does the thinking: it plans your day, adapts to your real life (busy weeks,
travel, motivation dips), and keeps you accountable on web — and (soon) WhatsApp.

## Stack

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS v4**
- **Clerk** — authentication
- **MongoDB Atlas** — data (with an in-memory dev fallback when `MONGODB_URI` is unset)
- **AI provider layer** — Gemini / OpenAI / Claude behind one interface, with a deterministic
  offline mock so everything runs without keys
- **Recharts** (lazy-loaded) · **Vitest** (policy unit tests)

## Key features

- **Adaptive Today screen** — one screen answering "what should I do right now?"
- **Coach Memory** — learns goals, patterns, and motivation; reflects on your behavior
- **Consistency engine** — streaks, 7/28-day rhythm, trend, momentum (the North Star)
- **Habits**, **gamification** (XP / levels / badges), and an **Achievements** screen
- **AI coach chat**, **adaptive workout & meal plans**, **AI meal-photo analysis**
- **WhatsApp-ready** channel + event layer (architecture in place; not wired yet)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you have; all integrations are optional
npm run dev                  # http://localhost:3000
```

The app runs end-to-end with **zero credentials** (dev auth + in-memory store + AI mock). Add any
key from `.env.example` and restart to light up that integration. Confirm AI wiring at
`GET /api/v1/ai/health?ping=1`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (pure-policy unit tests) |

## Architecture

- `app/` — App Router pages + `app/api/v1/*` (mobile-ready `{data,meta}` / `{error}` envelopes)
- `lib/policy/*` — pure, deterministic, unit-tested decision logic (today, consistency, insight, gamification)
- `lib/services/*` — domain services; all user data is `clerkUserId`-scoped via `OwnedRepository`
- `lib/ai/*` — provider registry + adapters + offline mock
- `lib/channels/*`, `lib/events/*` — channel-agnostic messaging + domain event bus
- `lib/db/*` — Mongo client, repository, indexes, dev in-memory store

Design docs live in `docs/architecture/` (start with `vision-and-north-star.md`). The current
status + roadmap is in [`NEXT-STEPS.md`](./NEXT-STEPS.md); the performance audit is in
[`PERFORMANCE-AUDIT.md`](./PERFORMANCE-AUDIT.md).

## Security

User data has no row-level security in MongoDB, so the `OwnedRepository` base class enforces
`clerkUserId` scoping on every read/write. Never commit secrets — `.env*` is git-ignored; set
production keys in the Vercel dashboard.

## License

Released under the [MIT License](./LICENSE).
